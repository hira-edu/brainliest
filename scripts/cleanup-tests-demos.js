#!/usr/bin/env node
'use strict';

const fs = require('fs/promises');
const path = require('path');

const CWD = process.cwd();
const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply') || args.has('--yes') || args.has('-y');
const VERBOSE = args.has('--verbose');

const SUFFIX_TARGETS = [
  '.test.tsx',
  '.test.ts',
  '.spec.tsx',
  '.spec.ts',
  '.stories.tsx',
  '.stories.ts',
  '.stories.mdx'
];

const EXPLICIT_DIRECTORIES = [
  path.join(CWD, 'tests')
];

const DEMO_DIR_NAMES = new Set(['demo', 'demos']);
const IGNORE_DIR_NAMES = new Set([
  '.git',
  'node_modules',
  '.turbo',
  '.next',
  'build',
  'dist',
  '.cache',
  '.storybook'
]);

const directoriesToRemove = new Set();
const filesToRemove = new Set();

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function isInsideTargetDir(filePath) {
  for (const dir of directoriesToRemove) {
    if (filePath.startsWith(dir + path.sep)) {
      return true;
    }
    if (filePath === dir) {
      return true;
    }
  }
  return false;
}

async function collectExplicitDirectories() {
  for (const dir of EXPLICIT_DIRECTORIES) {
    if (await fileExists(dir)) {
      directoriesToRemove.add(dir);
    }
  }
}

async function collectDemoDirectories(baseDir) {
  if (!(await fileExists(baseDir))) {
    return;
  }

  const queue = [baseDir];
  while (queue.length > 0) {
    const current = queue.pop();
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      if (VERBOSE) {
        console.warn(`[cleanup] Skipping ${current}: ${error.message}`);
      }
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const entryName = entry.name;
      if (IGNORE_DIR_NAMES.has(entryName)) {
        continue;
      }

      const fullPath = path.join(current, entryName);
      if (DEMO_DIR_NAMES.has(entryName.toLowerCase())) {
        directoriesToRemove.add(fullPath);
        continue;
      }

      queue.push(fullPath);
    }
  }
}

function matchesSuffix(filePath) {
  return SUFFIX_TARGETS.some((suffix) => filePath.endsWith(suffix));
}

async function collectFilesForRemoval(baseDir) {
  const queue = [baseDir];
  while (queue.length > 0) {
    const current = queue.pop();
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      if (VERBOSE) {
        console.warn(`[cleanup] Skipping ${current}: ${error.message}`);
      }
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (directoriesToRemove.has(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        if (IGNORE_DIR_NAMES.has(entry.name)) {
          continue;
        }
        if (isInsideTargetDir(fullPath)) {
          continue;
        }
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile() && matchesSuffix(fullPath)) {
        filesToRemove.add(fullPath);
      }
    }
  }
}

async function removeDirectory(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function removeFile(filePath) {
  await fs.rm(filePath, { force: true });
}

async function main() {
  await collectExplicitDirectories();
  await collectDemoDirectories(path.join(CWD, 'apps'));
  await collectFilesForRemoval(CWD);

  const sortedDirs = Array.from(directoriesToRemove).sort();
  const sortedFiles = Array.from(filesToRemove).sort();

  if (!APPLY) {
    if (sortedDirs.length === 0 && sortedFiles.length === 0) {
      console.log('No demo directories or test/story files detected.');
      return;
    }

    console.log('Cleanup plan (dry run):');
    if (sortedDirs.length > 0) {
      console.log(`  Directories (${sortedDirs.length}):`);
      for (const dir of sortedDirs) {
        console.log(`    - ${path.relative(CWD, dir)}`);
      }
    }
    if (sortedFiles.length > 0) {
      console.log(`  Files (${sortedFiles.length}):`);
      for (const file of sortedFiles) {
        console.log(`    - ${path.relative(CWD, file)}`);
      }
    }
    console.log('\nRe-run with --apply to delete the items above.');
    return;
  }

  let removedDirs = 0;
  for (const dir of sortedDirs) {
    if (VERBOSE) {
      console.log(`[cleanup] Removing directory ${path.relative(CWD, dir)}`);
    }
    await removeDirectory(dir);
    removedDirs += 1;
  }

  let removedFiles = 0;
  for (const file of sortedFiles) {
    if (VERBOSE) {
      console.log(`[cleanup] Removing file ${path.relative(CWD, file)}`);
    }
    await removeFile(file);
    removedFiles += 1;
  }

  console.log(`Removed ${removedDirs} director${removedDirs === 1 ? 'y' : 'ies'} and ${removedFiles} file${removedFiles === 1 ? '' : 's'}.`);
}

main().catch((error) => {
  console.error('[cleanup] Failed:', error);
  process.exitCode = 1;
});

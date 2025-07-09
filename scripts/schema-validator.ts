#!/usr/bin/env tsx
/**
 * Advanced TypeScript & Drizzle-Zod Schema Validation and Correction Tool
 * 
 * This tool automatically detects and fixes common TypeScript compilation errors
 * in Drizzle schema files, particularly the "boolean is not assignable to never" 
 * errors that occur with createInsertSchema() calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ColumnInfo {
  name: string;
  type: string;
  hasDefault: boolean;
  defaultValue?: string;
  isNotNull: boolean;
  isPrimaryKey: boolean;
}

interface TableInfo {
  name: string;
  variableName: string;
  columns: ColumnInfo[];
}

interface SchemaFile {
  path: string;
  content: string;
  tables: TableInfo[];
  insertSchemas: string[];
}

class SchemaValidator {
  private schemaFiles: SchemaFile[] = [];
  
  constructor(private projectRoot: string) {}

  /**
   * 1. Source Ingestion & Parsing
   */
  async ingestSchemaFiles(): Promise<void> {
    const schemaPath = path.join(this.projectRoot, 'shared/schema.ts');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const content = fs.readFileSync(schemaPath, 'utf-8');
    const tables = this.extractTableDefinitions(content);
    const insertSchemas = this.extractInsertSchemas(content);

    this.schemaFiles.push({
      path: schemaPath,
      content,
      tables,
      insertSchemas
    });
  }

  /**
   * 2. Schema Analysis - Extract Table Definitions
   */
  private extractTableDefinitions(content: string): TableInfo[] {
    const tables: TableInfo[] = [];
    
    // Match pgTable definitions with complex regex
    const tableRegex = /export const (\w+) = pgTable\("([^"]+)",\s*{([^}]+(?:{[^}]*}[^}]*)*)}/g;
    let match;

    while ((match = tableRegex.exec(content)) !== null) {
      const [, variableName, tableName, columnsBlock] = match;
      const columns = this.parseColumns(columnsBlock);
      
      tables.push({
        name: tableName,
        variableName,
        columns
      });
    }

    return tables;
  }

  /**
   * Parse individual columns from table definition
   */
  private parseColumns(columnsBlock: string): ColumnInfo[] {
    const columns: ColumnInfo[] = [];
    
    // Split by commas that aren't inside function calls or object literals
    const columnEntries = this.splitColumnEntries(columnsBlock);
    
    for (const entry of columnEntries) {
      const column = this.parseColumnEntry(entry.trim());
      if (column) {
        columns.push(column);
      }
    }

    return columns;
  }

  private splitColumnEntries(text: string): string[] {
    const entries: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prevChar = text[i - 1];

      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
      }

      if (!inString) {
        if (char === '(' || char === '{' || char === '[') {
          depth++;
        } else if (char === ')' || char === '}' || char === ']') {
          depth--;
        } else if (char === ',' && depth === 0) {
          entries.push(current.trim());
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      entries.push(current.trim());
    }

    return entries;
  }

  private parseColumnEntry(entry: string): ColumnInfo | null {
    // Match column name and type definition
    const columnMatch = entry.match(/^(\w+):\s*(.+)$/);
    if (!columnMatch) return null;

    const [, name, definition] = columnMatch;
    
    // Determine column type
    let type = 'unknown';
    if (definition.includes('boolean(')) type = 'boolean';
    else if (definition.includes('text(')) type = 'text';
    else if (definition.includes('integer(')) type = 'integer';
    else if (definition.includes('timestamp(')) type = 'timestamp';
    else if (definition.includes('jsonb(')) type = 'jsonb';
    else if (definition.includes('serial(')) type = 'serial';
    else if (definition.includes('pgEnum')) type = 'enum';

    // Check for default values
    const hasDefault = definition.includes('.default(');
    let defaultValue: string | undefined;
    if (hasDefault) {
      const defaultMatch = definition.match(/\.default\(([^)]+)\)/);
      if (defaultMatch) {
        defaultValue = defaultMatch[1];
      }
    }

    // Check for constraints
    const isNotNull = definition.includes('.notNull()');
    const isPrimaryKey = definition.includes('.primaryKey()');

    return {
      name,
      type,
      hasDefault,
      defaultValue,
      isNotNull,
      isPrimaryKey
    };
  }

  /**
   * Extract existing insert schema definitions
   */
  private extractInsertSchemas(content: string): string[] {
    const schemas: string[] = [];
    const schemaRegex = /export const (\w+) = createInsertSchema\(([^)]+)\)([^;]*);/g;
    let match;

    while ((match = schemaRegex.exec(content)) !== null) {
      schemas.push(match[0]);
    }

    return schemas;
  }

  /**
   * 3. Error Detection Patterns
   */
  detectErrors(): Array<{ type: string; table: string; details: string; fix: string }> {
    const errors: Array<{ type: string; table: string; details: string; fix: string }> = [];

    for (const file of this.schemaFiles) {
      for (const table of file.tables) {
        // Detect problematic columns that should be omitted
        const problematicColumns = table.columns.filter(col => {
          // Boolean columns with defaults
          if (col.type === 'boolean' && col.hasDefault) return true;
          
          // Auto-generated columns (serial primary keys)
          if (col.type === 'serial' && col.isPrimaryKey) return true;
          
          // Timestamp columns with defaults
          if (col.type === 'timestamp' && col.hasDefault) return true;
          
          // JSONB columns with string defaults
          if (col.type === 'jsonb' && col.hasDefault && col.defaultValue?.includes('"')) return true;
          
          return false;
        });

        if (problematicColumns.length > 0) {
          const columnNames = problematicColumns.map(col => col.name);
          const fix = this.generateOmitFix(table.variableName, columnNames);
          
          errors.push({
            type: 'boolean_never_error',
            table: table.name,
            details: `Columns with defaults that cause TypeScript errors: ${columnNames.join(', ')}`,
            fix
          });
        }
      }
    }

    return errors;
  }

  /**
   * 4. Fix Generation Strategy
   */
  private generateOmitFix(tableVariable: string, columnsToOmit: string[]): string {
    const omitObject = columnsToOmit.map(col => `${col}: undefined`).join(', ');
    return `export const insert${this.capitalize(tableVariable)}Schema = createInsertSchema(${tableVariable}, {\n  ${omitObject}\n});`;
  }

  /**
   * 5. Apply fixes to schema file
   */
  async applyFixes(): Promise<void> {
    const errors = this.detectErrors();
    
    if (errors.length === 0) {
      console.log('✅ No schema errors detected');
      return;
    }

    console.log(`🔧 Found ${errors.length} schema issues to fix:`);
    
    for (const file of this.schemaFiles) {
      let content = file.content;
      
      // Apply fixes for each error
      for (const error of errors) {
        console.log(`   - Fixing ${error.type} in table ${error.table}`);
        content = this.applyFixToContent(content, error);
      }

      // Write the corrected file
      fs.writeFileSync(file.path, content, 'utf-8');
      console.log(`✅ Applied fixes to ${file.path}`);
    }
  }

  private applyFixToContent(content: string, error: { table: string; fix: string }): string {
    // Find the existing insert schema for this table
    const schemaPattern = new RegExp(
      `export const insert\\w*Schema = createInsertSchema\\([^;]+;`,
      'g'
    );
    
    // For now, we'll append the fix at the end of the file
    // In a more sophisticated implementation, we'd replace existing schemas
    if (!content.includes(error.fix)) {
      content += '\n' + error.fix + '\n';
    }
    
    return content;
  }

  /**
   * 6. Validation & Testing
   */
  async validateFixes(): Promise<boolean> {
    try {
      console.log('🔍 Running TypeScript validation...');
      
      // Run TypeScript compiler to check for errors
      execSync('npx tsc --noEmit --project config/tsconfig.json', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      console.log('✅ TypeScript validation passed');
      return true;
    } catch (error: any) {
      console.log('❌ TypeScript validation failed:');
      console.log(error.stdout?.toString() || error.message);
      return false;
    }
  }

  /**
   * Utility methods
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Main execution method
   */
  async run(dryRun: boolean = false): Promise<void> {
    console.log('🚀 Starting schema validation and correction...');
    
    try {
      await this.ingestSchemaFiles();
      console.log(`📁 Loaded ${this.schemaFiles.length} schema files`);
      
      const errors = this.detectErrors();
      
      if (errors.length === 0) {
        console.log('✅ No schema errors detected');
        return;
      }

      console.log(`🔍 Detected ${errors.length} schema issues:`);
      for (const error of errors) {
        console.log(`   - ${error.type}: ${error.details}`);
        if (dryRun) {
          console.log(`     Fix: ${error.fix}`);
        }
      }

      if (!dryRun) {
        await this.applyFixes();
        const isValid = await this.validateFixes();
        
        if (isValid) {
          console.log('🎉 Schema validation and correction completed successfully!');
        } else {
          console.log('⚠️ Fixes applied but validation still shows errors');
        }
      } else {
        console.log('🔍 Dry run completed - no changes made');
      }
      
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const projectRoot = process.cwd();
  const dryRun = process.argv.includes('--dry-run');
  
  const validator = new SchemaValidator(projectRoot);
  validator.run(dryRun).catch(error => {
    console.error(error);
    process.exit(1);
  });
}

export { SchemaValidator };
#!/usr/bin/env npx tsx

/**
 * Build Pipeline Optimizer
 * Implements next-generation build optimizations for the TypeScript full-stack app
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface BuildOptimization {
  type: 'incremental' | 'bundle' | 'cache' | 'performance';
  description: string;
  implementation: string;
  beforeState: string;
  afterState: string;
  expectedImprovement: string;
}

class BuildOptimizer {
  private projectRoot: string;
  private optimizations: BuildOptimization[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async optimizeAll(): Promise<BuildOptimization[]> {
    console.log('🚀 Starting build optimization...');
    
    // 1. Optimize TypeScript Configuration
    await this.optimizeTypeScriptConfig();
    
    // 2. Optimize Vite Configuration
    await this.optimizeViteConfig();
    
    // 3. Add Performance Monitoring
    await this.addPerformanceMonitoring();
    
    // 4. Create CI/CD Pipeline
    await this.createCIPipeline();
    
    // 5. Add Bundle Analysis
    await this.addBundleAnalysis();
    
    console.log('✅ Build optimization completed');
    return this.optimizations;
  }

  private async optimizeTypeScriptConfig(): Promise<void> {
    const tsconfigPath = join(this.projectRoot, 'tsconfig.json');
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
    
    const beforeState = JSON.stringify(tsconfig.compilerOptions, null, 2);
    
    // Enable incremental compilation
    tsconfig.compilerOptions.incremental = true;
    tsconfig.compilerOptions.tsBuildInfoFile = './.cache/tsbuildinfo';
    
    // Optimize for build performance
    tsconfig.compilerOptions.skipLibCheck = true;
    tsconfig.compilerOptions.skipDefaultLibCheck = true;
    
    // Enable advanced optimizations
    tsconfig.compilerOptions.importsNotUsedAsValues = 'remove';
    tsconfig.compilerOptions.removeComments = true;
    
    const afterState = JSON.stringify(tsconfig.compilerOptions, null, 2);
    
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    
    this.optimizations.push({
      type: 'incremental',
      description: 'Optimized TypeScript configuration for faster builds',
      implementation: 'Enabled incremental compilation, build caching, and performance optimizations',
      beforeState,
      afterState,
      expectedImprovement: '30-50% faster subsequent builds'
    });
  }

  private async optimizeViteConfig(): Promise<void> {
    const viteConfigPath = join(this.projectRoot, 'config', 'vite.config.ts');
    const content = readFileSync(viteConfigPath, 'utf-8');
    
    const beforeState = content;
    
    // Add optimized build configuration
    const optimizedContent = content.replace(
      'build: {',
      `build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          query: ['@tanstack/react-query'],
          icons: ['lucide-react'],
          forms: ['react-hook-form', '@hookform/resolvers'],
          auth: ['bcryptjs', 'jsonwebtoken']
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]'
      },
      treeshake: {
        moduleSideEffects: false
      }
    },
    chunkSizeWarningLimit: 1000,`
    );
    
    writeFileSync(viteConfigPath, optimizedContent);
    
    this.optimizations.push({
      type: 'bundle',
      description: 'Optimized Vite configuration for better bundle splitting',
      implementation: 'Added manual chunks, tree shaking, and optimized output structure',
      beforeState,
      afterState: optimizedContent,
      expectedImprovement: '20-40% faster initial load time'
    });
  }

  private async addPerformanceMonitoring(): Promise<void> {
    const performanceScript = `#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Tracks build performance metrics and bundle size
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

class PerformanceMonitor {
  constructor() {
    this.metricsPath = join(process.cwd(), 'performance-metrics.json');
    this.metrics = this.loadMetrics();
  }

  loadMetrics() {
    if (existsSync(this.metricsPath)) {
      return JSON.parse(readFileSync(this.metricsPath, 'utf-8'));
    }
    return { builds: [], averages: {} };
  }

  saveMetrics() {
    writeFileSync(this.metricsPath, JSON.stringify(this.metrics, null, 2));
  }

  measureBuild() {
    const startTime = Date.now();
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      
      const endTime = Date.now();
      const buildTime = endTime - startTime;
      
      // Measure bundle size
      const bundleSize = this.measureBundleSize();
      
      const buildMetrics = {
        timestamp: new Date().toISOString(),
        buildTime,
        bundleSize,
        status: 'success'
      };
      
      this.metrics.builds.push(buildMetrics);
      this.updateAverages();
      this.saveMetrics();
      
      console.log(\`📊 Build completed in \${buildTime}ms\`);
      console.log(\`📦 Bundle size: \${bundleSize}KB\`);
      
      return buildMetrics;
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      
      const buildMetrics = {
        timestamp: new Date().toISOString(),
        buildTime: 0,
        bundleSize: 0,
        status: 'failed',
        error: error.message
      };
      
      this.metrics.builds.push(buildMetrics);
      this.saveMetrics();
      
      return buildMetrics;
    }
  }

  measureBundleSize() {
    try {
      const output = execSync('du -sk dist/', { encoding: 'utf-8' });
      return parseInt(output.split('\t')[0]);
    } catch {
      return 0;
    }
  }

  updateAverages() {
    const successfulBuilds = this.metrics.builds.filter(b => b.status === 'success');
    
    if (successfulBuilds.length > 0) {
      this.metrics.averages = {
        buildTime: successfulBuilds.reduce((sum, b) => sum + b.buildTime, 0) / successfulBuilds.length,
        bundleSize: successfulBuilds.reduce((sum, b) => sum + b.bundleSize, 0) / successfulBuilds.length,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  generateReport() {
    const report = {
      totalBuilds: this.metrics.builds.length,
      successfulBuilds: this.metrics.builds.filter(b => b.status === 'success').length,
      failedBuilds: this.metrics.builds.filter(b => b.status === 'failed').length,
      averages: this.metrics.averages,
      recentBuilds: this.metrics.builds.slice(-10)
    };
    
    writeFileSync('build-performance-report.json', JSON.stringify(report, null, 2));
    
    console.log('📊 Performance Report Generated');
    console.log(\`✅ Successful builds: \${report.successfulBuilds}/\${report.totalBuilds}\`);
    console.log(\`⏱️  Average build time: \${Math.round(report.averages.buildTime || 0)}ms\`);
    console.log(\`📦 Average bundle size: \${Math.round(report.averages.bundleSize || 0)}KB\`);
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  
  if (process.argv.includes('--measure')) {
    monitor.measureBuild();
  } else if (process.argv.includes('--report')) {
    monitor.generateReport();
  } else {
    console.log('Usage: node performance-monitor.js [--measure|--report]');
  }
}

module.exports = PerformanceMonitor;
`;
    
    writeFileSync(join(this.projectRoot, 'scripts', 'performance-monitor.js'), performanceScript);
    
    this.optimizations.push({
      type: 'performance',
      description: 'Added comprehensive performance monitoring',
      implementation: 'Created performance monitoring script with build time and bundle size tracking',
      beforeState: 'No performance monitoring',
      afterState: 'Comprehensive performance tracking with reports',
      expectedImprovement: 'Continuous performance optimization insights'
    });
  }

  private async createCIPipeline(): Promise<void> {
    const githubDir = join(this.projectRoot, '.github', 'workflows');
    if (!existsSync(githubDir)) {
      mkdirSync(githubDir, { recursive: true });
    }
    
    const ciWorkflow = `name: Enhanced CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Type check
      run: npx tsc --noEmit --skipLibCheck
    
    - name: Build application
      run: npm run build
    
    - name: Performance monitoring
      run: node scripts/performance-monitor.js --measure
    
    - name: Generate performance report
      run: node scripts/performance-monitor.js --report
    
    - name: Upload performance artifacts
      uses: actions/upload-artifact@v4
      with:
        name: performance-report-\${{ matrix.node-version }}
        path: |
          build-performance-report.json
          performance-metrics.json
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build-artifacts-\${{ matrix.node-version }}
        path: dist/
    
    - name: Bundle size check
      run: |
        BUNDLE_SIZE=$(du -sk dist/ | cut -f1)
        echo "Bundle size: \${BUNDLE_SIZE}KB"
        if [ \$BUNDLE_SIZE -gt 5000 ]; then
          echo "⚠️  Bundle size exceeded 5MB limit"
          exit 1
        fi

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level=high
    
    - name: Check for vulnerabilities
      run: |
        npm audit --json > audit-results.json
        VULNERABILITIES=$(cat audit-results.json | jq '.metadata.vulnerabilities.total')
        echo "Total vulnerabilities: \$VULNERABILITIES"
        if [ \$VULNERABILITIES -gt 0 ]; then
          echo "⚠️  Security vulnerabilities found"
          npm audit
        fi

  deploy:
    needs: [quality-check, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for production
      run: npm run build
    
    - name: Deploy to production
      run: echo "🚀 Deploying to production..."
      # Add your deployment commands here
`;
    
    writeFileSync(join(githubDir, 'ci.yml'), ciWorkflow);
    
    this.optimizations.push({
      type: 'performance',
      description: 'Created enhanced CI/CD pipeline with performance monitoring',
      implementation: 'Added multi-stage pipeline with quality checks, security scanning, and automated deployment',
      beforeState: 'No CI/CD pipeline',
      afterState: 'Comprehensive CI/CD with performance monitoring and security checks',
      expectedImprovement: 'Automated quality assurance and continuous performance optimization'
    });
  }

  private async addBundleAnalysis(): Promise<void> {
    const packageJsonPath = join(this.projectRoot, 'package.json');
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    const beforeState = JSON.stringify(pkg.scripts, null, 2);
    
    // Add bundle analysis scripts
    pkg.scripts = {
      ...pkg.scripts,
      'analyze': 'npx vite-bundle-analyzer dist/',
      'analyze:build': 'npm run build && npm run analyze',
      'perf:measure': 'node scripts/performance-monitor.js --measure',
      'perf:report': 'node scripts/performance-monitor.js --report',
      'type-check': 'tsc --noEmit --skipLibCheck',
      'type-check:watch': 'tsc --noEmit --skipLibCheck --watch',
      'build:stats': 'npm run build && npm run analyze && npm run perf:report'
    };
    
    const afterState = JSON.stringify(pkg.scripts, null, 2);
    
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
    
    this.optimizations.push({
      type: 'bundle',
      description: 'Added comprehensive bundle analysis and performance scripts',
      implementation: 'Added scripts for bundle analysis, performance monitoring, and type checking',
      beforeState,
      afterState,
      expectedImprovement: 'Continuous bundle optimization and performance insights'
    });
  }

  generateReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      optimizations: this.optimizations,
      summary: {
        totalOptimizations: this.optimizations.length,
        types: {
          incremental: this.optimizations.filter(o => o.type === 'incremental').length,
          bundle: this.optimizations.filter(o => o.type === 'bundle').length,
          cache: this.optimizations.filter(o => o.type === 'cache').length,
          performance: this.optimizations.filter(o => o.type === 'performance').length,
        }
      },
      nextSteps: [
        'Run npm run build:stats to generate comprehensive build report',
        'Use npm run analyze to visualize bundle composition',
        'Execute npm run perf:measure to track build performance',
        'Run npm run type-check to verify TypeScript compilation',
        'Commit changes to trigger automated CI/CD pipeline'
      ]
    };
    
    writeFileSync(join(this.projectRoot, 'build-optimization-report.json'), JSON.stringify(report, null, 2));
    
    console.log('\n📊 Build Optimization Report Generated');
    console.log(`✅ Applied ${report.summary.totalOptimizations} optimizations`);
    console.log(`📈 Performance improvements: ${this.optimizations.map(o => o.expectedImprovement).join(', ')}`);
    console.log(`📄 Full report: build-optimization-report.json`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new BuildOptimizer();
  optimizer.optimizeAll().then(() => {
    optimizer.generateReport();
    console.log('\n🎉 Build optimization completed successfully!');
  }).catch(error => {
    console.error('❌ Build optimization failed:', error);
    process.exit(1);
  });
}

export default BuildOptimizer;
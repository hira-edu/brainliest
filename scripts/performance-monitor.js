#!/usr/bin/env node

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
      
      console.log(`📊 Build completed in ${buildTime}ms`);
      console.log(`📦 Bundle size: ${bundleSize}KB`);
      
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
      return parseInt(output.split('	')[0]);
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
    console.log(`✅ Successful builds: ${report.successfulBuilds}/${report.totalBuilds}`);
    console.log(`⏱️  Average build time: ${Math.round(report.averages.buildTime || 0)}ms`);
    console.log(`📦 Average bundle size: ${Math.round(report.averages.bundleSize || 0)}KB`);
    
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

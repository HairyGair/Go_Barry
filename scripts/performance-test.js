import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPerformance() {
  console.log('🚀 Starting Operations Centre Performance Tests');
  console.log('==============================================\n');
  
  let chrome;
  
  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({ 
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] 
    });
    
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
      },
    };
    
    console.log('Running Lighthouse performance audit...\n');
    
    const runnerResult = await lighthouse(
      'http://localhost:8081/operations-centre', 
      options
    );
    
    // Analyse results
    const { lhr } = runnerResult;
    const performance = lhr.categories.performance.score * 100;
    
    console.log('📊 Performance Metrics:');
    console.log(`Overall Score: ${performance.toFixed(1)}%`);
    console.log(performance >= 90 ? '✅ Excellent!' : performance >= 50 ? '⚠️  Needs improvement' : '❌ Poor performance');
    console.log('\n📈 Core Web Vitals:');
    
    // Define performance targets
    const checks = [
      { 
        name: 'First Contentful Paint', 
        key: 'first-contentful-paint', 
        target: 2000,
        unit: 'ms' 
      },
      { 
        name: 'Speed Index', 
        key: 'speed-index', 
        target: 3000,
        unit: 'ms' 
      },
      { 
        name: 'Largest Contentful Paint', 
        key: 'largest-contentful-paint', 
        target: 2500,
        unit: 'ms' 
      },
      { 
        name: 'Time to Interactive', 
        key: 'interactive', 
        target: 3500,
        unit: 'ms' 
      },
      { 
        name: 'Total Blocking Time', 
        key: 'total-blocking-time', 
        target: 300,
        unit: 'ms' 
      },
      { 
        name: 'Cumulative Layout Shift', 
        key: 'cumulative-layout-shift', 
        target: 0.1,
        unit: '' 
      },
    ];
    
    const metrics = lhr.audits;
    const results = {
      passed: 0,
      failed: 0,
      metrics: []
    };
    
    checks.forEach(({ name, key, target, unit }) => {
      const audit = metrics[key];
      if (audit) {
        const value = audit.numericValue;
        const pass = unit === '' ? value <= target : value <= target;
        
        results.metrics.push({
          name,
          value: unit === '' ? value.toFixed(3) : Math.round(value),
          target,
          unit,
          pass
        });
        
        if (pass) results.passed++;
        else results.failed++;
        
        console.log(
          `${pass ? '✅' : '❌'} ${name}: ${
            unit === '' ? value.toFixed(3) : Math.round(value)
          }${unit} (target: ${target}${unit})`
        );
      }
    });
    
    // Additional metrics
    console.log('\n📦 Resource Metrics:');
    
    const resourceMetrics = [
      { name: 'JavaScript execution time', key: 'bootup-time' },
      { name: 'DOM size', key: 'dom-size' },
      { name: 'Network requests', key: 'network-requests' },
      { name: 'Total byte weight', key: 'total-byte-weight' },
    ];
    
    resourceMetrics.forEach(({ name, key }) => {
      const audit = metrics[key];
      if (audit) {
        console.log(`• ${name}: ${audit.displayValue || audit.numericValue}`);
      }
    });
    
    // Opportunities for improvement
    console.log('\n💡 Top Opportunities:');
    const opportunities = Object.values(metrics)
      .filter(audit => audit.details && audit.details.type === 'opportunity')
      .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
      .slice(0, 3);
    
    opportunities.forEach((opp, index) => {
      console.log(`${index + 1}. ${opp.title}`);
      if (opp.displayValue) {
        console.log(`   Potential savings: ${opp.displayValue}`);
      }
    });
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:8081/operations-centre',
      performanceScore: performance,
      metrics: results.metrics,
      summary: {
        passed: results.passed,
        failed: results.failed,
        total: results.passed + results.failed
      }
    };
    
    // Save detailed report
    const reportPath = path.join(__dirname, `performance-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Final summary
    console.log('\n==============================================');
    console.log(`✅ Passed: ${results.passed}/${results.passed + results.failed} metrics`);
    
    if (performance >= 90) {
      console.log('🎉 Excellent performance! The Operations Centre is fast!');
    } else if (performance >= 50) {
      console.log('⚠️  Performance is acceptable but could be improved.');
    } else {
      console.log('❌ Performance needs significant improvement.');
    }
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

// Run the performance test
testPerformance().catch(console.error);

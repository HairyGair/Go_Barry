// backend/tests/communications/run-tests.js
// Test runner for Communications Platform
// Executes integration and unit tests with reporting

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class TestRunner {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      coverage: null,
      errors: []
    };
    this.logFile = path.join(process.cwd(), 'logs', 'communications-test-results.json');
  }

  async runAllTests() {
    console.log('🧪 Starting Communications Platform Test Suite...\n');
    
    const startTime = Date.now();
    
    try {
      // Ensure logs directory exists
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });
      
      // Run unit tests
      console.log('1️⃣ Running Unit Tests...');
      const unitResults = await this.runUnitTests();
      
      // Run integration tests (if backend is running)
      console.log('\n2️⃣ Running Integration Tests...');
      const integrationResults = await this.runIntegrationTests();
      
      // Generate coverage report
      console.log('\n3️⃣ Generating Coverage Report...');
      const coverageResults = await this.generateCoverageReport();
      
      // Compile final results
      this.testResults = {
        total: unitResults.total + integrationResults.total,
        passed: unitResults.passed + integrationResults.passed,
        failed: unitResults.failed + integrationResults.failed,
        duration: Date.now() - startTime,
        coverage: coverageResults,
        unitTests: unitResults,
        integrationTests: integrationResults,
        timestamp: new Date().toISOString()
      };
      
      // Save results
      await this.saveResults();
      
      // Print summary
      this.printSummary();
      
      // Return exit code
      return this.testResults.failed === 0 ? 0 : 1;
      
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      return 1;
    }
  }

  async runUnitTests() {
    try {
      console.log('   Running unit test suite...');
      
      // Run mocha unit tests
      const { stdout, stderr } = await execAsync(
        'npx mocha backend/tests/communications/unit.test.js --reporter json',
        { timeout: 30000 }
      );
      
      const results = JSON.parse(stdout);
      
      const unitResults = {
        total: results.stats.tests,
        passed: results.stats.passes,
        failed: results.stats.failures,
        duration: results.stats.duration,
        errors: results.failures || []
      };
      
      console.log(`   ✅ Unit Tests: ${unitResults.passed}/${unitResults.total} passed`);
      
      if (unitResults.failed > 0) {
        console.log(`   ❌ Failed tests: ${unitResults.failed}`);
        unitResults.errors.forEach(error => {
          console.log(`      - ${error.title}: ${error.err.message}`);
        });
      }
      
      return unitResults;
      
    } catch (error) {
      console.error('   ❌ Unit tests failed to run:', error.message);
      return {
        total: 0,
        passed: 0,
        failed: 1,
        duration: 0,
        errors: [{ message: error.message }]
      };
    }
  }

  async runIntegrationTests() {
    try {
      // Check if backend is running
      const backendRunning = await this.checkBackendHealth();
      
      if (!backendRunning) {
        console.log('   ⚠️ Backend not running - skipping integration tests');
        return {
          total: 0,
          passed: 0,
          failed: 0,
          duration: 0,
          skipped: true,
          reason: 'Backend not available'
        };
      }
      
      console.log('   Running integration test suite...');
      
      // Run mocha integration tests
      const { stdout, stderr } = await execAsync(
        'npx mocha backend/tests/communications/integration.test.js --reporter json --timeout 60000',
        { timeout: 120000 }
      );
      
      const results = JSON.parse(stdout);
      
      const integrationResults = {
        total: results.stats.tests,
        passed: results.stats.passes,
        failed: results.stats.failures,
        duration: results.stats.duration,
        errors: results.failures || []
      };
      
      console.log(`   ✅ Integration Tests: ${integrationResults.passed}/${integrationResults.total} passed`);
      
      if (integrationResults.failed > 0) {
        console.log(`   ❌ Failed tests: ${integrationResults.failed}`);
        integrationResults.errors.forEach(error => {
          console.log(`      - ${error.title}: ${error.err.message}`);
        });
      }
      
      return integrationResults;
      
    } catch (error) {
      console.error('   ❌ Integration tests failed:', error.message);
      return {
        total: 0,
        passed: 0,
        failed: 1,
        duration: 0,
        errors: [{ message: error.message }]
      };
    }
  }

  async checkBackendHealth() {
    try {
      const { stdout } = await execAsync(
        'curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health',
        { timeout: 5000 }
      );
      
      return stdout.trim() === '200';
    } catch (error) {
      return false;
    }
  }

  async generateCoverageReport() {
    try {
      console.log('   Generating test coverage...');
      
      // Run nyc for coverage (if available)
      const { stdout } = await execAsync(
        'npx nyc --reporter=json --report-dir=logs mocha backend/tests/communications/*.test.js',
        { timeout: 60000 }
      );
      
      // Parse coverage results
      const coverageFile = path.join('logs', 'coverage-final.json');
      try {
        const coverageData = await fs.readFile(coverageFile, 'utf8');
        const coverage = JSON.parse(coverageData);
        
        // Calculate overall coverage
        let totalLines = 0;
        let coveredLines = 0;
        
        Object.values(coverage).forEach(file => {
          if (file.s) {
            totalLines += Object.keys(file.s).length;
            coveredLines += Object.values(file.s).filter(count => count > 0).length;
          }
        });
        
        const coveragePercentage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
        
        console.log(`   📊 Code Coverage: ${coveragePercentage.toFixed(1)}%`);
        
        return {
          percentage: coveragePercentage,
          lines: { total: totalLines, covered: coveredLines },
          detailed: coverage
        };
        
      } catch (coverageError) {
        console.log('   ⚠️ Coverage report not available');
        return null;
      }
      
    } catch (error) {
      console.log('   ⚠️ Coverage generation failed:', error.message);
      return null;
    }
  }

  async saveResults() {
    try {
      await fs.writeFile(
        this.logFile,
        JSON.stringify(this.testResults, null, 2),
        'utf8'
      );
      console.log(`\n📄 Test results saved to: ${this.logFile}`);
    } catch (error) {
      console.error('❌ Failed to save test results:', error);
    }
  }

  printSummary() {
    const { total, passed, failed, duration, coverage } = this.testResults;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMMUNICATIONS PLATFORM TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`📊 Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    
    if (coverage) {
      console.log(`📈 Coverage: ${coverage.percentage.toFixed(1)}%`);
    }
    
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);
    
    console.log('\n' + '='.repeat(60));
    
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Communications platform is ready.');
    } else {
      console.log('⚠️ Some tests failed. Check the detailed results above.');
    }
    
    console.log('='.repeat(60));
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner();
  
  runner.runAllTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Test runner crashed:', error);
      process.exit(1);
    });
}

export default TestRunner;
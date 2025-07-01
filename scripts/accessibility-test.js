import { AxePuppeteer } from '@axe-core/puppeteer';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAccessibility() {
  console.log('♿ Starting Operations Centre Accessibility Tests');
  console.log('==============================================\n');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport to desktop size
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Loading Operations Centre...');
    await page.goto('http://localhost:8081/operations-centre', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="operation-card-0"]', { 
      timeout: 10000 
    });
    
    console.log('Running accessibility audit...\n');
    
    // Run axe accessibility tests
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    console.log('📊 Accessibility Test Results:');
    console.log(`Total violations: ${results.violations.length}`);
    console.log(`Total passes: ${results.passes.length}`);
    console.log(`Inapplicable rules: ${results.inapplicable.length}\n`);
    
    // Categorize violations by impact
    const violationsByImpact = {
      critical: [],
      serious: [],
      moderate: [],
      minor: []
    };
    
    results.violations.forEach(violation => {
      violationsByImpact[violation.impact].push(violation);
    });
    
    // Display violations by severity
    if (violationsByImpact.critical.length > 0) {
      console.log('🚨 CRITICAL Issues (Must fix):');
      violationsByImpact.critical.forEach(displayViolation);
    }
    
    if (violationsByImpact.serious.length > 0) {
      console.log('\n❌ SERIOUS Issues (Should fix):');
      violationsByImpact.serious.forEach(displayViolation);
    }
    
    if (violationsByImpact.moderate.length > 0) {
      console.log('\n⚠️  MODERATE Issues (Consider fixing):');
      violationsByImpact.moderate.forEach(displayViolation);
    }
    
    if (violationsByImpact.minor.length > 0) {
      console.log('\n💡 MINOR Issues (Nice to fix):');
      violationsByImpact.minor.forEach(displayViolation);
    }
    
    // Summary of common issues
    console.log('\n📋 Issue Summary:');
    const issueCounts = {};
    results.violations.forEach(violation => {
      issueCounts[violation.id] = (issueCounts[violation.id] || 0) + violation.nodes.length;
    });
    
    Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([id, count]) => {
        const violation = results.violations.find(v => v.id === id);
        console.log(`• ${violation.description}: ${count} instance(s)`);
      });
    
    // Test specific accessibility features
    console.log('\n🔍 Specific Accessibility Checks:');
    
    // Check for keyboard navigation
    const focusableElements = await page.$$('a, button, input, select, textarea, [tabindex]');
    console.log(`✅ Focusable elements: ${focusableElements.length}`);
    
    // Check for alt text on images
    const images = await page.$$('img');
    const imagesWithAlt = await page.$$('img[alt]');
    console.log(`${imagesWithAlt.length === images.length ? '✅' : '❌'} Image alt text: ${imagesWithAlt.length}/${images.length} images have alt text`);
    
    // Check for ARIA labels
    const ariaElements = await page.$$('[aria-label], [aria-labelledby], [aria-describedby]');
    console.log(`✅ ARIA labels: ${ariaElements.length} elements with ARIA attributes`);
    
    // Check color contrast
    const contrastViolations = results.violations.filter(v => 
      v.id.includes('contrast') || v.id.includes('color')
    );
    console.log(`${contrastViolations.length === 0 ? '✅' : '❌'} Color contrast: ${contrastViolations.length} contrast issue(s)`);
    
    // Check for headings structure
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    console.log(`✅ Heading structure: ${headings.length} headings found`);
    
    // Generate detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:8081/operations-centre',
      summary: {
        violations: results.violations.length,
        passes: results.passes.length,
        critical: violationsByImpact.critical.length,
        serious: violationsByImpact.serious.length,
        moderate: violationsByImpact.moderate.length,
        minor: violationsByImpact.minor.length
      },
      violations: results.violations,
      passes: results.passes.map(p => ({ id: p.id, description: p.description }))
    };
    
    // Save report
    const reportPath = path.join(__dirname, `accessibility-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Final verdict
    console.log('\n==============================================');
    if (results.violations.length === 0) {
      console.log('🎉 Perfect! No accessibility violations found!');
    } else if (violationsByImpact.critical.length === 0 && violationsByImpact.serious.length === 0) {
      console.log('✅ Good! Only minor accessibility issues found.');
    } else {
      console.log('❌ Accessibility issues found that need attention.');
    }
    
    // Recommendations
    if (results.violations.length > 0) {
      console.log('\n📝 Recommendations:');
      console.log('1. Fix all critical and serious issues first');
      console.log('2. Use automated testing in your CI/CD pipeline');
      console.log('3. Test with screen readers (NVDA, JAWS, VoiceOver)');
      console.log('4. Ensure keyboard navigation works for all features');
      console.log('5. Maintain WCAG 2.1 AA compliance');
    }
    
  } catch (error) {
    console.error('❌ Accessibility test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function displayViolation(violation) {
  console.log(`\n  ${violation.id}: ${violation.description}`);
  console.log(`  Help: ${violation.help}`);
  console.log(`  Affected elements: ${violation.nodes.length}`);
  
  // Show first 3 affected elements
  violation.nodes.slice(0, 3).forEach((node, index) => {
    console.log(`    ${index + 1}. ${node.target.join(' > ')}`);
  });
  
  if (violation.nodes.length > 3) {
    console.log(`    ... and ${violation.nodes.length - 3} more`);
  }
}

// Run the accessibility test
testAccessibility().catch(console.error);

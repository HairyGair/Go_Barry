#!/usr/bin/env node
// analyze-component-usage.js
// Analyze which React components are actually used in the codebase

const fs = require('fs');
const path = require('path');

const componentsDir = '/Users/anthony/Go BARRY App/Go_BARRY/components';
const appDir = '/Users/anthony/Go BARRY App/Go_BARRY/app';

// Get all component files
function getComponentFiles() {
  try {
    return fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.jsx'))
      .map(file => file.replace('.jsx', ''));
  } catch (error) {
    console.error('Error reading components directory:', error.message);
    return [];
  }
}

// Search for component usage in files
function searchForUsage(componentName, searchDir) {
  const usages = [];
  
  function searchInFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for imports and usage patterns
      const importPattern = new RegExp(`import.*${componentName}.*from`, 'i');
      const usagePattern = new RegExp(`<${componentName}[^>]*>`, 'g');
      
      if (importPattern.test(content) || usagePattern.test(content)) {
        const matches = content.match(usagePattern) || [];
        usages.push({
          file: filePath.replace('/Users/anthony/Go BARRY App/', ''),
          imports: importPattern.test(content),
          usageCount: matches.length
        });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  function searchDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          searchDirectory(fullPath);
        } else if (stat.isFile() && (item.endsWith('.jsx') || item.endsWith('.js') || item.endsWith('.tsx') || item.endsWith('.ts'))) {
          searchInFile(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  searchDirectory(searchDir);
  return usages;
}

// Main analysis
function analyzeComponentUsage() {
  console.log('🔍 Analyzing BARRY component usage...\n');
  
  const components = getComponentFiles();
  const results = {
    used: [],
    unused: [],
    testOnly: []
  };
  
  for (const component of components) {
    console.log(`📊 Analyzing: ${component}.jsx`);
    
    const usages = searchForUsage(component, '/Users/anthony/Go BARRY App/Go_BARRY');
    
    if (usages.length === 0) {
      results.unused.push(component);
      console.log(`   ❌ UNUSED - No imports or usage found`);
    } else {
      // Check if only used in test/debug files
      const nonTestUsages = usages.filter(usage => 
        !usage.file.includes('test') && 
        !usage.file.includes('debug') && 
        !usage.file.includes('Test') && 
        !usage.file.includes('Debug')
      );
      
      if (nonTestUsages.length === 0) {
        results.testOnly.push({ component, usages });
        console.log(`   🧪 TEST ONLY - Used in: ${usages.map(u => u.file).join(', ')}`);
      } else {
        results.used.push({ component, usages: nonTestUsages });
        console.log(`   ✅ USED - Found in: ${nonTestUsages.map(u => u.file).join(', ')}`);
      }
    }
  }
  
  console.log('\n📋 ANALYSIS SUMMARY:');
  console.log('==================');
  
  console.log(`\n✅ USED COMPONENTS (${results.used.length}):`);
  results.used.forEach(({ component, usages }) => {
    console.log(`   ${component}.jsx - Used in ${usages.length} file(s)`);
  });
  
  console.log(`\n🧪 TEST-ONLY COMPONENTS (${results.testOnly.length}):`);
  results.testOnly.forEach(({ component, usages }) => {
    console.log(`   ${component}.jsx - Test/debug only`);
  });
  
  console.log(`\n❌ UNUSED COMPONENTS (${results.unused.length}):`);
  results.unused.forEach(component => {
    console.log(`   ${component}.jsx - No usage found`);
  });
  
  console.log('\n🧹 CLEANUP RECOMMENDATIONS:');
  console.log('===========================');
  
  if (results.unused.length > 0) {
    console.log('1. Consider removing these unused components:');
    results.unused.forEach(component => console.log(`   - ${component}.jsx`));
  }
  
  if (results.testOnly.length > 0) {
    console.log('2. Move test-only components to dev folder:');
    results.testOnly.forEach(({ component }) => console.log(`   - ${component}.jsx`));
  }
  
  const totalComponents = components.length;
  const activeComponents = results.used.length;
  const cleanupPotential = results.unused.length + results.testOnly.length;
  
  console.log(`\n📊 COMPONENT STATISTICS:`);
  console.log(`   Total Components: ${totalComponents}`);
  console.log(`   Actively Used: ${activeComponents} (${Math.round(activeComponents/totalComponents*100)}%)`);
  console.log(`   Can be cleaned up: ${cleanupPotential} (${Math.round(cleanupPotential/totalComponents*100)}%)`);
}

// Run the analysis
analyzeComponentUsage();
#!/usr/bin/env node

console.log('📦 Checking test dependencies...\n');

const dependencies = [
  'puppeteer',
  'lighthouse', 
  '@axe-core/puppeteer',
  'chrome-launcher'
];

let missingDeps = [];

for (const dep of dependencies) {
  try {
    await import(dep);
    console.log(`✅ ${dep} - installed`);
  } catch (error) {
    console.log(`❌ ${dep} - NOT installed`);
    missingDeps.push(dep);
  }
}

if (missingDeps.length > 0) {
  console.log('\n⚠️  Missing dependencies detected!');
  console.log('\nRun this command to install them:');
  console.log(`npm install --save-dev ${missingDeps.join(' ')}`);
} else {
  console.log('\n✅ All test dependencies are installed!');
}

#!/usr/bin/env node
/*
 * Go Barry - Traffic Intelligence Platform
 * UK Localisation Validator Script
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

// DEBUG: Log if this script is being processed by Metro
if (typeof __METRO_GLOBAL_PREFIX__ !== 'undefined') {
  console.error('🚨 WARNING: check-uk-spelling.js is being processed by Metro bundler!');
}

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// US to UK spelling mappings to check
const spellingChecks = [
  // Common words
  { us: /\bcenter\b/gi, uk: 'centre', context: 'text' },
  { us: /\bCenter\b/g, uk: 'Centre', context: 'text' },
  { us: /\bcolor\b/gi, uk: 'colour', context: 'text' },
  { us: /\bColor\b/g, uk: 'Colour', context: 'text' },
  { us: /\borganize\b/gi, uk: 'organise', context: 'text' },
  { us: /\bOrganize\b/g, uk: 'Organise', context: 'text' },
  { us: /\borganizing\b/gi, uk: 'organising', context: 'text' },
  { us: /\borganized\b/gi, uk: 'organised', context: 'text' },
  { us: /\banalyze\b/gi, uk: 'analyse', context: 'text' },
  { us: /\bAnalyze\b/g, uk: 'Analyse', context: 'text' },
  { us: /\banalyzing\b/gi, uk: 'analysing', context: 'text' },
  { us: /\boptimize\b/gi, uk: 'optimise', context: 'text' },
  { us: /\bOptimize\b/g, uk: 'Optimise', context: 'text' },
  { us: /\boptimizing\b/gi, uk: 'optimising', context: 'text' },
  { us: /\brealize\b/gi, uk: 'realise', context: 'text' },
  { us: /\bRealize\b/g, uk: 'Realise', context: 'text' },
  { us: /\bauthorize\b/gi, uk: 'authorise', context: 'text' },
  { us: /\bAuthorize\b/g, uk: 'Authorise', context: 'text' },
  { us: /\bsynchronize\b/gi, uk: 'synchronise', context: 'text' },
  { us: /\bSynchronize\b/g, uk: 'Synchronise', context: 'text' },
  { us: /\bprioritize\b/gi, uk: 'prioritise', context: 'text' },
  { us: /\bPrioritize\b/g, uk: 'Prioritise', context: 'text' },
  { us: /\bhonor\b/gi, uk: 'honour', context: 'text' },
  { us: /\bHonor\b/g, uk: 'Honour', context: 'text' },
  { us: /\bfavor\b/gi, uk: 'favour', context: 'text' },
  { us: /\bFavor\b/g, uk: 'Favour', context: 'text' },
  { us: /\bbehavior\b/gi, uk: 'behaviour', context: 'text' },
  { us: /\bBehavior\b/g, uk: 'Behaviour', context: 'text' },
];

// Find all JS/JSX files in operations centre
const files = glob.sync('app/operations-centre/**/*.{js,jsx}', {
  cwd: path.join(__dirname, '..', 'Go_BARRY'),
  absolute: true
});

console.log(`\n🇬🇧 UK Localisation Check for Operations Centre`);
console.log(`${'='.repeat(50)}\n`);
console.log(`Found ${files.length} files to check\n`);

let totalIssues = 0;
const issuesByFile = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const fileIssues = [];
  
  lines.forEach((line, lineNum) => {
    // Skip lines that are clearly code (not text)
    if (line.trim().startsWith('//') || 
        line.trim().startsWith('*') ||
        line.includes('import ') ||
        line.includes('export ') ||
        line.includes('const ') ||
        line.includes('let ') ||
        line.includes('var ') ||
        line.includes('function ')) {
      return;
    }
    
    // Check for US spellings in string literals
    spellingChecks.forEach(({ us, uk, context }) => {
      // Look for the pattern in quoted strings
      const stringPattern = /(['"`])([^'"`]*?)(\1)/g;
      let match;
      
      while ((match = stringPattern.exec(line)) !== null) {
        const stringContent = match[2];
        if (us.test(stringContent)) {
          // Skip if it's a CSS property (color, textAlign, etc.)
          if (context === 'text' && !line.includes('style') && !line.includes('Style')) {
            fileIssues.push({
              line: lineNum + 1,
              content: line.trim(),
              us: stringContent.match(us)[0],
              uk: uk,
              fullMatch: match[0]
            });
          }
        }
      }
    });
  });
  
  if (fileIssues.length > 0) {
    issuesByFile[file] = fileIssues;
    totalIssues += fileIssues.length;
  }
});

// Report findings
if (totalIssues === 0) {
  console.log('✅ All text uses correct UK spelling!\n');
} else {
  console.log(`⚠️  Found ${totalIssues} US spelling issues:\n`);
  
  Object.entries(issuesByFile).forEach(([file, issues]) => {
    if (file && typeof file === 'string') {
      const basePath = process.cwd() || __dirname || '/';
      const relPath = path.relative(basePath, file);
      console.log(`\n📄 ${relPath}:`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}: "${issue.us}" → "${issue.uk}"`);
        console.log(`   ${issue.content}`);
      });
    }
  });
  
  console.log(`\n💡 Run the automated fix script to update these automatically.`);
}

// Also check for correct UK spelling usage
console.log(`\n✅ Verified UK Spellings:`);
const ukTermsFound = {
  'Centre': 0,
  'Colour': 0,
  'Organise': 0,
  'Analyse': 0,
  'Optimise': 0,
  'Realise': 0,
  'Authorise': 0,
  'Synchronise': 0,
  'Prioritise': 0,
};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  Object.keys(ukTermsFound).forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      ukTermsFound[term] += matches.length;
    }
  });
});

Object.entries(ukTermsFound).forEach(([term, count]) => {
  if (count > 0) {
    console.log(`   ${term}: ${count} usage${count > 1 ? 's' : ''}`);
  }
});

console.log('\n✅ UK Localisation check complete!\n');

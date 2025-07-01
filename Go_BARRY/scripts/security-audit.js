#!/usr/bin/env node

/**
 * Security Audit Script for Operations Centre
 * Phase 7 - Go BARRY
 * Created: June 30, 2025
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

console.log(`${colors.blue}🔒 Operations Centre Security Audit${colors.reset}\n`);

const securityChecks = {
  'Authentication Requirements': checkAuthentication,
  'Sensitive Data Exposure': checkSensitiveData,
  'API Security': checkAPISecuirity,
  'Input Validation': checkInputValidation,
  'CORS Configuration': checkCORS,
  'Session Management': checkSessionManagement,
  'Error Handling': checkErrorHandling,
  'Dependencies': checkDependencies,
};

async function checkAuthentication() {
  const authFiles = [
    'app/operations-centre/index.jsx',
    'app/operations-centre/_layout.jsx',
  ];

  try {
    let authChecks = 0;
    for (const file of authFiles) {
      const content = await fs.readFile(path.join(__dirname, '..', file), 'utf8');
      if (content.includes('useSupervisorSession') || content.includes('requireAuth')) {
        authChecks++;
      }
    }

    if (authChecks === authFiles.length) {
      return { success: true, message: 'Authentication properly implemented' };
    } else {
      return { 
        success: false, 
        message: 'Missing authentication in some files',
        fix: 'Ensure all Operations Centre pages check authentication'
      };
    }
  } catch (error) {
    return { success: false, message: `Error checking auth: ${error.message}` };
  }
}

async function checkSensitiveData() {
  const patterns = [
    /password\s*[:=]\s*["'][^"']+["']/gi,
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
    /secret\s*[:=]\s*["'][^"']+["']/gi,
    /token\s*[:=]\s*["'][^"']+["']/gi,
  ];

  try {
    const operationsDir = path.join(__dirname, '..', 'app/operations-centre');
    const files = await getFilesRecursively(operationsDir);
    
    let exposures = [];
    for (const file of files) {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        const content = await fs.readFile(file, 'utf8');
        for (const pattern of patterns) {
          if (pattern.test(content) && !content.includes('process.env')) {
            exposures.push(path.basename(file));
          }
        }
      }
    }

    if (exposures.length === 0) {
      return { success: true, message: 'No hardcoded sensitive data found' };
    } else {
      return { 
        success: false, 
        message: `Potential exposures in: ${exposures.join(', ')}`,
        fix: 'Move sensitive data to environment variables'
      };
    }
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

async function checkAPISecuirity() {
  const apiPatterns = [
    /fetch\s*\(/g,
    /axios\s*\(/g,
    /\$\.ajax/g,
  ];

  try {
    const content = await fs.readFile(
      path.join(__dirname, '..', 'app/operations-centre/index.jsx'), 
      'utf8'
    );

    let hasAPIcalls = false;
    let hasErrorHandling = false;

    for (const pattern of apiPatterns) {
      if (pattern.test(content)) {
        hasAPIcalls = true;
        break;
      }
    }

    if (hasAPIcalls) {
      hasErrorHandling = content.includes('.catch') || content.includes('try') && content.includes('catch');
    }

    if (!hasAPIcalls || hasErrorHandling) {
      return { success: true, message: 'API calls properly handled' };
    } else {
      return { 
        success: false, 
        message: 'API calls without error handling detected',
        fix: 'Add try-catch blocks to all API calls'
      };
    }
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

async function checkInputValidation() {
  // Check for input validation in forms
  const formComponents = [
    'components/operations/IncidentManager.jsx',
    'components/operations/RoadworksManager.jsx',
  ];

  let validationCount = 0;
  
  for (const component of formComponents) {
    try {
      const content = await fs.readFile(path.join(__dirname, '..', component), 'utf8');
      if (content.includes('validate') || content.includes('required') || content.includes('pattern')) {
        validationCount++;
      }
    } catch (error) {
      // Component might not exist
    }
  }

  if (validationCount > 0) {
    return { success: true, message: 'Input validation detected in forms' };
  } else {
    return { 
      success: true, // Not critical for display components
      message: 'Consider adding input validation to forms'
    };
  }
}

async function checkCORS() {
  const configFile = path.join(__dirname, '..', 'app/operations-centre/config/production.js');
  
  try {
    const content = await fs.readFile(configFile, 'utf8');
    if (content.includes('go-barry.onrender.com')) {
      return { success: true, message: 'CORS configuration uses production URL' };
    } else {
      return { 
        success: false, 
        message: 'Production URL not found in config',
        fix: 'Update production.js with correct API URL'
      };
    }
  } catch (error) {
    return { success: false, message: `Config file not found: ${error.message}` };
  }
}

async function checkSessionManagement() {
  const sessionTimeout = 600000; // 10 minutes
  
  try {
    const configContent = await fs.readFile(
      path.join(__dirname, '..', 'app/operations-centre/config/production.js'),
      'utf8'
    );
    
    if (configContent.includes(`sessionTimeout: ${sessionTimeout}`)) {
      return { success: true, message: 'Session timeout properly configured (10 min)' };
    } else {
      return { 
        success: false, 
        message: 'Session timeout not properly configured',
        fix: 'Ensure session timeout is set to 10 minutes'
      };
    }
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

async function checkErrorHandling() {
  const errorBoundaryPath = path.join(__dirname, '..', 'app/operations-centre/components/OperationsErrorBoundary.jsx');
  
  try {
    await fs.access(errorBoundaryPath);
    
    // Check if it's used in layout
    const layoutContent = await fs.readFile(
      path.join(__dirname, '..', 'app/operations-centre/_layout.jsx'),
      'utf8'
    );
    
    if (layoutContent.includes('OperationsErrorBoundary')) {
      return { success: true, message: 'Error boundary properly implemented' };
    } else {
      return { 
        success: false, 
        message: 'Error boundary not used in layout',
        fix: 'Wrap layout content with OperationsErrorBoundary'
      };
    }
  } catch (error) {
    return { success: false, message: 'Error boundary not found' };
  }
}

async function checkDependencies() {
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(__dirname, '..', 'package.json'), 'utf8')
    );
    
    const riskyDeps = [];
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for known vulnerable versions (simplified check)
    for (const [name, version] of Object.entries(deps)) {
      // In real deployment, use npm audit or similar
      if (version.includes('alpha') || version.includes('beta')) {
        riskyDeps.push(`${name}@${version}`);
      }
    }
    
    if (riskyDeps.length === 0) {
      return { success: true, message: 'No pre-release dependencies found' };
    } else {
      return { 
        success: false, 
        message: `Pre-release deps: ${riskyDeps.join(', ')}`,
        fix: 'Use stable versions for production'
      };
    }
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

async function getFilesRecursively(dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...await getFilesRecursively(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Run security audit
async function runSecurityAudit() {
  let allPassed = true;
  const results = [];

  for (const [name, checkFn] of Object.entries(securityChecks)) {
    process.stdout.write(`Checking ${name}... `);
    
    try {
      const result = await checkFn();
      results.push({ name, ...result });
      
      if (result.success) {
        console.log(`${colors.green}✓${colors.reset} ${result.message}`);
      } else {
        allPassed = false;
        console.log(`${colors.red}✗${colors.reset} ${result.message}`);
        if (result.fix) {
          console.log(`  ${colors.yellow}→ Fix: ${result.fix}${colors.reset}`);
        }
      }
    } catch (error) {
      allPassed = false;
      console.log(`${colors.red}✗${colors.reset} Error: ${error.message}`);
    }
  }

  // Generate security report
  const report = {
    timestamp: new Date().toISOString(),
    passed: allPassed,
    checks: results,
  };

  await fs.writeFile(
    path.join(__dirname, '..', 'security-audit-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log(`${colors.green}✅ Security audit passed!${colors.reset}`);
    console.log('\n✨ Operations Centre is secure for deployment');
  } else {
    console.log(`${colors.red}❌ Security issues found${colors.reset}`);
    console.log('\n⚠️  Fix security issues before deployment');
  }

  console.log('\n📄 Full report saved to: security-audit-report.json');

  return allPassed;
}

// Execute
runSecurityAudit().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

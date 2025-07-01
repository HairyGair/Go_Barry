#!/usr/bin/env node

/**
 * Fix Operations Centre deployment issues
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

console.log(`${colors.blue}🔧 Fixing Operations Centre Deployment${colors.reset}\n`);

async function checkRouteStructure() {
  console.log('Checking route structure...');
  
  const requiredFiles = [
    'app/operations.jsx',
    'app/operations-centre.jsx',
    'app/operations-centre/index.jsx',
    'app/operations-centre/_layout.jsx',
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    try {
      await fs.access(filePath);
      console.log(`${colors.green}✓${colors.reset} ${file} exists`);
    } catch {
      missingFiles.push(file);
      console.log(`${colors.red}✗${colors.reset} ${file} missing`);
    }
  }
  
  return missingFiles.length === 0;
}

async function createWebBuildConfig() {
  console.log('\nCreating web build configuration...');
  
  const webConfig = {
    "expo": {
      "web": {
        "bundler": "metro",
        "output": "static",
        "favicon": "./assets/favicon.png"
      }
    }
  };
  
  try {
    // Read existing app.json
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(await fs.readFile(appJsonPath, 'utf8'));
    
    // Merge web config
    appJson.expo.web = {
      ...appJson.expo.web,
      ...webConfig.expo.web
    };
    
    // Write back
    await fs.writeFile(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log(`${colors.green}✓${colors.reset} Updated app.json with web config`);
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Failed to update app.json:`, error.message);
  }
}

async function verifyImports() {
  console.log('\nVerifying imports in operations-centre...');
  
  try {
    const indexPath = path.join(__dirname, '..', 'app/operations-centre/index.jsx');
    const content = await fs.readFile(indexPath, 'utf8');
    
    // Check for problematic imports
    const issues = [];
    
    if (content.includes("from './utils/security'") && !await fs.access(path.join(__dirname, '..', 'app/operations-centre/utils/security.js')).then(() => true).catch(() => false)) {
      issues.push('Missing security.js file');
    }
    
    if (content.includes("from './utils/performance'") && !await fs.access(path.join(__dirname, '..', 'app/operations-centre/utils/performance.js')).then(() => true).catch(() => false)) {
      issues.push('Missing performance.js file');
    }
    
    if (issues.length === 0) {
      console.log(`${colors.green}✓${colors.reset} All imports verified`);
      return true;
    } else {
      issues.forEach(issue => {
        console.log(`${colors.yellow}⚠${colors.reset} ${issue}`);
      });
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Failed to verify imports:`, error.message);
    return false;
  }
}

async function createMissingUtils() {
  console.log('\nCreating missing utility files...');
  
  const utilsDir = path.join(__dirname, '..', 'app/operations-centre/utils');
  
  // Ensure utils directory exists
  await fs.mkdir(utilsDir, { recursive: true });
  
  // Create security.js if missing
  const securityPath = path.join(utilsDir, 'security.js');
  try {
    await fs.access(securityPath);
  } catch {
    const securityContent = `// Security utilities for Operations Centre
export function validateSession(session) {
  return session && session.supervisor && session.timestamp;
}

export function checkPermissions(role) {
  return ['supervisor', 'admin'].includes(role);
}

export function auditLog(action, data) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(\`[AUDIT] \${action}:\`, data);
  }
}
`;
    await fs.writeFile(securityPath, securityContent);
    console.log(`${colors.green}✓${colors.reset} Created security.js`);
  }
  
  // Create performance.js if missing
  const performancePath = path.join(utilsDir, 'performance.js');
  try {
    await fs.access(performancePath);
  } catch {
    const performanceContent = `// Performance utilities for Operations Centre
export function useThrottle(fn, delay) {
  let lastCall = 0;
  
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  };
}

export class PerformanceMonitor {
  constructor() {
    this.measures = {};
  }
  
  startMeasure(name) {
    this.measures[name] = Date.now();
  }
  
  endMeasure(name) {
    if (this.measures[name]) {
      const duration = Date.now() - this.measures[name];
      if (process.env.NODE_ENV !== 'production') {
        console.log(\`[PERF] \${name}: \${duration}ms\`);
      }
      delete this.measures[name];
    }
  }
}
`;
    await fs.writeFile(performancePath, performanceContent);
    console.log(`${colors.green}✓${colors.reset} Created performance.js`);
  }
}

async function runFixes() {
  console.log('Running deployment fixes...\n');
  
  // Check route structure
  const routesOk = await checkRouteStructure();
  
  // Create web build config
  await createWebBuildConfig();
  
  // Create missing utilities
  await createMissingUtils();
  
  // Verify imports
  const importsOk = await verifyImports();
  
  console.log('\n' + '='.repeat(50));
  
  if (routesOk && importsOk) {
    console.log(`${colors.green}✅ All fixes applied successfully!${colors.reset}`);
    console.log('\nNext steps:');
    console.log('1. Clear build cache: npm run reset');
    console.log('2. Rebuild: npm run build:web:production');
    console.log('3. Deploy to Render');
  } else {
    console.log(`${colors.yellow}⚠️ Some issues remain${colors.reset}`);
    console.log('\nManual fixes may be required.');
  }
}

// Execute
runFixes().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

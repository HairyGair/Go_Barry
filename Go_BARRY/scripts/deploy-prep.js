#!/usr/bin/env node

/**
 * Operations Centre Deployment Preparation Script
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

console.log(`${colors.blue}🚀 Operations Centre Deployment Preparation${colors.reset}\n`);

// Deployment checks
const checks = {
  'Environment Variables': checkEnvVars,
  'Build Configuration': checkBuildConfig,
  'Dependencies': checkDependencies,
  'File Permissions': checkFilePermissions,
  'Memory Usage': checkMemoryUsage,
  'API Connectivity': checkAPIConnectivity,
};

async function checkEnvVars() {
  const required = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_CONVEX_URL',
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length === 0) {
    return { success: true, message: 'All required environment variables present' };
  } else {
    return { 
      success: false, 
      message: `Missing: ${missing.join(', ')}`,
      fix: 'Add missing variables to .env file'
    };
  }
}

async function checkBuildConfig() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.build) {
      return { success: true, message: 'Build script configured' };
    } else {
      return { 
        success: false, 
        message: 'No build script found',
        fix: 'Add "build": "expo build:web" to package.json scripts'
      };
    }
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

async function checkDependencies() {
  const criticalDeps = [
    'react',
    'react-native',
    'expo',
    'expo-router',
    'convex',
  ];

  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const missing = criticalDeps.filter(dep => !deps[dep]);
    
    if (missing.length === 0) {
      return { success: true, message: 'All critical dependencies installed' };
    } else {
      return { 
        success: false, 
        message: `Missing: ${missing.join(', ')}`,
        fix: `Run: npm install ${missing.join(' ')}`
      };
    }
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

async function checkFilePermissions() {
  const criticalFiles = [
    'app/operations-centre/index.jsx',
    'app/operations-centre/_layout.jsx',
  ];

  try {
    for (const file of criticalFiles) {
      const filePath = path.join(__dirname, '..', file);
      await fs.access(filePath, fs.constants.R_OK);
    }
    return { success: true, message: 'All critical files accessible' };
  } catch (error) {
    return { 
      success: false, 
      message: 'Some files not accessible',
      fix: 'Check file permissions'
    };
  }
}

async function checkMemoryUsage() {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const limit = 2048; // 2GB limit on Render
  
  if (heapUsedMB < limit * 0.8) {
    return { 
      success: true, 
      message: `Heap usage: ${heapUsedMB}MB (${Math.round(heapUsedMB/limit*100)}% of limit)`
    };
  } else {
    return { 
      success: false, 
      message: `High memory usage: ${heapUsedMB}MB`,
      fix: 'Optimize memory usage before deployment'
    };
  }
}

async function checkAPIConnectivity() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://go-barry.onrender.com';
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${apiUrl}/api/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      return { success: true, message: `API reachable at ${apiUrl}` };
    } else {
      return { 
        success: false, 
        message: `API returned ${response.status}`,
        fix: 'Check API server status'
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'API unreachable',
      fix: 'Ensure backend is running'
    };
  }
}

// Run all checks
async function runChecks() {
  let allPassed = true;

  for (const [name, checkFn] of Object.entries(checks)) {
    process.stdout.write(`Checking ${name}... `);
    
    try {
      const result = await checkFn();
      
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

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log(`${colors.green}✅ All deployment checks passed!${colors.reset}`);
    console.log('\nNext steps:');
    console.log('1. Run production build: npm run build');
    console.log('2. Test production build locally');
    console.log('3. Deploy to Render.com');
  } else {
    console.log(`${colors.red}❌ Some checks failed. Fix issues before deployment.${colors.reset}`);
  }

  return allPassed;
}

// Execute
runChecks().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

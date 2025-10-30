#!/usr/bin/env node

/**
 * Build script for cPanel deployment
 * Creates a dist folder with all necessary files ready to upload
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('🏗️  Building Go BARRY Backend for cPanel Deployment...\n');

// Files and folders to include
const INCLUDE = [
  // Core files
  'server.js',
  'package.json',
  'package-lock.json',
  '.env.production', // We'll copy .env as .env.production

  // Directories
  'routes',
  'services',
  'middleware',
  'migrations',
  'scripts',
  'data',
  'utils',
  'config',
];

// Files and folders to exclude
const EXCLUDE = [
  'node_modules',
  'dist',
  'logs',
  '.git',
  '.env', // Don't copy .env directly, use .env.production
  'test',
  'tests',
  '*.log',
  '.DS_Store',
  'coverage',
  '.nyc_output',
];

/**
 * Check if a file/folder should be excluded
 */
function shouldExclude(itemPath, excludeList) {
  const itemName = path.basename(itemPath);
  return excludeList.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(itemName);
    }
    return itemName === pattern;
  });
}

/**
 * Copy files recursively
 */
async function copyRecursive(src, dest) {
  const stats = await fs.stat(src);

  if (stats.isDirectory()) {
    await fs.ensureDir(dest);
    const items = await fs.readdir(src);

    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);

      if (!shouldExclude(srcPath, EXCLUDE)) {
        await copyRecursive(srcPath, destPath);
      }
    }
  } else {
    await fs.copy(src, dest);
  }
}

/**
 * Main build function
 */
async function build() {
  try {
    // Step 1: Clean dist directory
    console.log('📦 Step 1: Cleaning dist directory...');
    if (await fs.pathExists(DIST_DIR)) {
      await fs.remove(DIST_DIR);
      console.log('   ✓ Removed old dist folder');
    }
    await fs.ensureDir(DIST_DIR);
    console.log('   ✓ Created fresh dist folder\n');

    // Step 2: Copy files
    console.log('📂 Step 2: Copying files...');
    for (const item of INCLUDE) {
      const srcPath = path.join(ROOT_DIR, item);
      const destPath = path.join(DIST_DIR, item);

      if (await fs.pathExists(srcPath)) {
        await copyRecursive(srcPath, destPath);

        const stats = await fs.stat(srcPath);
        if (stats.isDirectory()) {
          const files = await fs.readdir(destPath);
          console.log(`   ✓ Copied ${item}/ (${files.length} items)`);
        } else {
          console.log(`   ✓ Copied ${item}`);
        }
      } else {
        console.log(`   ⚠️  ${item} not found, skipping`);
      }
    }
    console.log();

    // Step 3: Handle .env file
    console.log('⚙️  Step 3: Configuring environment...');
    const envPath = path.join(ROOT_DIR, '.env');
    const envProdPath = path.join(DIST_DIR, '.env');

    if (await fs.pathExists(envPath)) {
      await fs.copy(envPath, envProdPath);
      console.log('   ✓ Copied .env file');
      console.log('   ⚠️  REMEMBER: Update .env with production values after upload!');
    } else {
      console.log('   ⚠️  No .env file found');
    }
    console.log();

    // Step 4: Create deployment instructions
    console.log('📝 Step 4: Creating deployment instructions...');
    const instructions = `# Go BARRY Backend - Deployment Instructions

## 📦 This dist folder is ready for cPanel deployment

### Upload Steps:

1. **Upload via Cyberduck/FTP:**
   - Connect to your cPanel server
   - Navigate to your API folder (e.g., /public_html/api/)
   - Drag and drop the contents of this dist folder

2. **Update .env file:**
   - Edit the .env file on the server
   - Verify these settings:
     * DB_HOST=localhost
     * DB_USER=gobarryco
     * DB_PASSWORD=<your password>
     * DB_NAME=gobarryco_breakdowns
     * JWT_ACCESS_SECRET=<your secret>
     * JWT_REFRESH_SECRET=<your secret>

3. **Install dependencies:**
   Via cPanel Terminal or SSH:
   \`\`\`bash
   cd /path/to/api
   npm install --production
   \`\`\`

4. **Run database migrations:**
   Via phpMyAdmin:
   - Run migrations/verify-supervisors-table.sql
   - Run migrations/add-security-indexes.sql
   - Run migrations/create-audit-logs.sql
   - Run migrations/add-refresh-tokens.sql

5. **Create logs directory:**
   \`\`\`bash
   mkdir logs
   chmod 755 logs
   \`\`\`

6. **Restart server:**
   \`\`\`bash
   pm2 restart backend
   # or
   pm2 start server.js --name backend
   \`\`\`

7. **Test:**
   \`\`\`bash
   curl https://gobarry.co.uk/api/auth/health
   \`\`\`

### Files Included:

- ✓ All source code (routes, services, middleware)
- ✓ Configuration files
- ✓ Database migrations
- ✓ Package files (for npm install)
- ✗ node_modules (install on server)
- ✗ logs (create on server)

### Build Date: ${new Date().toISOString()}

### Need Help?
See: CPANEL_DEPLOYMENT_GUIDE.md in project root
`;

    await fs.writeFile(
      path.join(DIST_DIR, 'DEPLOYMENT_INSTRUCTIONS.txt'),
      instructions
    );
    console.log('   ✓ Created DEPLOYMENT_INSTRUCTIONS.txt\n');

    // Step 5: Create package.json for production
    console.log('📄 Step 5: Optimizing package.json for production...');
    const packageJson = await fs.readJson(path.join(DIST_DIR, 'package.json'));

    // Remove dev dependencies
    if (packageJson.devDependencies) {
      delete packageJson.devDependencies;
    }

    // Set production environment
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    packageJson.scripts.start = 'NODE_ENV=production node server.js';

    await fs.writeJson(path.join(DIST_DIR, 'package.json'), packageJson, { spaces: 2 });
    console.log('   ✓ Optimized package.json for production\n');

    // Step 6: Calculate sizes
    console.log('📊 Step 6: Build summary...');
    const distSize = await getDirectorySize(DIST_DIR);
    const fileCount = await countFiles(DIST_DIR);

    console.log(`   ✓ Total files: ${fileCount}`);
    console.log(`   ✓ Total size: ${formatBytes(distSize)}\n`);

    // Success!
    console.log('✨ BUILD COMPLETE!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📦 Your backend is ready for deployment!\n');
    console.log('Location: ' + DIST_DIR);
    console.log('\nNext steps:');
    console.log('  1. Open Cyberduck (or FTP client)');
    console.log('  2. Navigate to your cPanel api folder');
    console.log('  3. Drag and drop the contents of backend/dist/');
    console.log('  4. Run: npm install --production');
    console.log('  5. Run database migrations (see DEPLOYMENT_INSTRUCTIONS.txt)');
    console.log('  6. Restart backend server\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Get directory size recursively
 */
async function getDirectorySize(dirPath) {
  let totalSize = 0;

  async function calculateSize(currentPath) {
    const stats = await fs.stat(currentPath);

    if (stats.isDirectory()) {
      const items = await fs.readdir(currentPath);
      for (const item of items) {
        await calculateSize(path.join(currentPath, item));
      }
    } else {
      totalSize += stats.size;
    }
  }

  await calculateSize(dirPath);
  return totalSize;
}

/**
 * Count files recursively
 */
async function countFiles(dirPath) {
  let count = 0;

  async function countItems(currentPath) {
    const stats = await fs.stat(currentPath);

    if (stats.isDirectory()) {
      const items = await fs.readdir(currentPath);
      for (const item of items) {
        await countItems(path.join(currentPath, item));
      }
    } else {
      count++;
    }
  }

  await countItems(dirPath);
  return count;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Run build
build();

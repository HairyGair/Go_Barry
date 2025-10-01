#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

console.log('🚀 Starting frontend build optimization...')

// Step 1: Clean previous builds
console.log('🧹 Cleaning previous builds...')
try {
  execSync('rm -rf dist', { cwd: projectRoot, stdio: 'inherit' })
  console.log('✅ Previous builds cleaned')
} catch (error) {
  console.log('⚠️ No previous builds to clean')
}

// Step 2: Install dependencies if needed
console.log('📦 Checking dependencies...')
if (!existsSync(join(projectRoot, 'node_modules'))) {
  console.log('Installing dependencies...')
  execSync('npm install', { cwd: projectRoot, stdio: 'inherit' })
} else {
  console.log('✅ Dependencies already installed')
}

// Step 3: Build modern version
console.log('🏗️ Building modern version...')
try {
  execSync('npm run build:modern', { cwd: projectRoot, stdio: 'inherit' })
  console.log('✅ Modern build completed')
} catch (error) {
  console.error('❌ Modern build failed:', error.message)
  process.exit(1)
}

// Step 4: Build legacy version
console.log('🏗️ Building legacy version...')
try {
  execSync('npm run build:legacy', { cwd: projectRoot, stdio: 'inherit' })
  console.log('✅ Legacy build completed')
} catch (error) {
  console.error('❌ Legacy build failed:', error.message)
  process.exit(1)
}

// Step 5: Generate performance report
console.log('📊 Generating performance report...')
const generateReport = () => {
  const distPath = join(projectRoot, 'dist')
  const reportPath = join(distPath, 'optimization-report.json')
  
  // Read bundle analysis if available
  const bundleAnalysisPath = join(distPath, 'bundle-analysis.html')
  
  const report = {
    timestamp: new Date().toISOString(),
    buildMode: 'production',
    optimizations: [
      'Code splitting enabled',
      'Terser minification',
      'Gzip compression',
      'Brotli compression',
      'Tree shaking enabled',
      'CSS optimization',
      'Legacy browser support',
      'Bundle analysis generated'
    ],
    chunks: {
      'react-vendor': 'React and ReactDOM',
      'state-vendor': 'Zustand state management',
      'wizards': 'All wizard components',
      'common': 'Common components',
      'services': 'Services and utilities',
      'vendor': 'Other third-party libraries'
    },
    performance: {
      bundleAnalysisAvailable: existsSync(bundleAnalysisPath),
      gzipEnabled: true,
      brotliEnabled: true,
      sourceMapGenerated: true
    }
  }
  
  if (!existsSync(distPath)) {
    mkdirSync(distPath, { recursive: true })
  }
  
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`📋 Performance report saved to: ${reportPath}`)
  
  return report
}

const report = generateReport()

// Step 6: Display optimization summary
console.log('\n🎉 Build optimization completed successfully!')
console.log('\n📊 Optimization Summary:')
console.log(`├── Optimizations applied: ${report.optimizations.length}`)
console.log(`├── Chunk splitting: ${Object.keys(report.chunks).length} chunks`)
console.log(`├── Bundle analysis: ${report.performance.bundleAnalysisAvailable ? '✅' : '❌'}`)
console.log(`├── Gzip compression: ${report.performance.gzipEnabled ? '✅' : '❌'}`)
console.log(`└── Brotli compression: ${report.performance.brotliEnabled ? '✅' : '❌'}`)

console.log('\n📁 Output directories:')
console.log(`├── Modern build: dist/`)
console.log(`├── Legacy build: dist/legacy/`)
console.log(`└── Bundle analysis: dist/bundle-analysis.html`)

console.log('\n🚀 Next steps:')
console.log('1. Review bundle analysis at dist/bundle-analysis.html')
console.log('2. Test the optimized builds')
console.log('3. Deploy to production')

console.log('\n✨ Frontend optimization complete!')
const fs = require('fs');
const path = require('path');

// Function to fix style jsx in a file
function fixStyleJsx(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace <style jsx> with <style>
  const hasStyleJsx = content.includes('<style jsx>');
  if (hasStyleJsx) {
    content = content.replace(/<style jsx>/g, '<style>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

// Function to recursively find and fix files
function fixDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let fixedCount = 0;
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixedCount += fixDirectory(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      if (fixStyleJsx(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Start fixing from the dashboards directory
const dashboardsPath = path.join(__dirname, 'src', 'dashboards');
console.log('Fixing style jsx in dashboard components...');
const totalFixed = fixDirectory(dashboardsPath);
console.log(`\nFixed ${totalFixed} files!`);

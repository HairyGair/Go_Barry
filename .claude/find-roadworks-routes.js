import fs from 'fs/promises';

const content = await fs.readFile('/Users/anthony/Go BARRY App/backend/index.js', 'utf8');
const lines = content.split('\n');

// Find lines with app.use and roadworks
const roadworksRoutes = [];
lines.forEach((line, index) => {
  if (line.includes('app.use') && line.toLowerCase().includes('roadwork')) {
    roadworksRoutes.push({ line: index + 1, content: line.trim() });
  }
});

console.log('Found roadworks routes:');
roadworksRoutes.forEach(route => {
  console.log(`Line ${route.line}: ${route.content}`);
});
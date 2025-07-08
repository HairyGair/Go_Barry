// This script fixes the RoadworksDatabase.jsx file by adding the export statement at the end

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'RoadworksDatabase.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// Check if export statement already exists at the end
if (!content.trim().endsWith('export default RoadworksDatabase;')) {
  // Add export statement at the very end
  const newContent = content.trimEnd() + '\n\nexport default RoadworksDatabase;\n';
  fs.writeFileSync(filePath, newContent);
  console.log('✅ Added export statement to RoadworksDatabase.jsx');
} else {
  console.log('✅ Export statement already exists');
}

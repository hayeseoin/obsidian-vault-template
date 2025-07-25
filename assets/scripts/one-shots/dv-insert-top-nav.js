const fs = require('fs');
const path = require('path');

const vaultDir = '../../..'; // <-- change this
const templatePath = path.resolve(vaultDir, 'assets/templates/dataview/dv-top-nav.md');

const template = fs.readFileSync(templatePath, 'utf-8');

fs.readdirSync(vaultDir).forEach(file => {
  if (!file.endsWith('.md') || file === 'index.md') return;

  const filePath = path.join(vaultDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Find first H1 line
  const lines = content.split('\n');
  const h1Index = lines.findIndex(line => line.startsWith('# '));
  if (h1Index === -1) {
    console.warn(`⚠️ No H1 found in ${file}, skipping`);
    return;
  }

  // Check if template is already inserted to avoid duplication
  if (lines.slice(h1Index + 1, h1Index + 1 + template.split('\n').length).join('\n').includes(template.trim())) {
    console.log(`✅ Template already exists in ${file}`);
    return;
  }

  // Insert template after H1
  const newLines = [
    ...lines.slice(0, h1Index + 1),
    template.trim(),
    '',
    ...lines.slice(h1Index + 1)
  ];

  fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
  console.log(`🔧 Inserted template into: ${file}`);
});

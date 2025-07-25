const fs = require('fs');
const path = require('path');

const vaultDir = '../../..'; // <-- change this
const dvEndPattern = /\/\/ DV_TEMPLATE_END[\s\S]*?```[ \t]*\n*/gm;

fs.readdirSync(vaultDir).forEach(file => {
  if (!file.endsWith('.md') || file === 'index.md') return;

  const filePath = path.join(vaultDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Match the nav block's end and collapse extra newlines
  const cleaned = content.replace(dvEndPattern, match => {
    return match.trimEnd() + '\n';
  });

  if (cleaned !== content) {
    fs.writeFileSync(filePath, cleaned, 'utf-8');
    console.log(`✨ Cleaned whitespace in: ${file}`);
  }
});

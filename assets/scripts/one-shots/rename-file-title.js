const fs = require('fs');
const path = require('path');

const vaultDir = '../../..'; // <-- change this

// Utility to extract YAML frontmatter title
function extractTitleFromContent(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = match[1];
  const titleLine = frontmatter.split('\n').find(line => line.trim().startsWith('title:'));
  if (!titleLine) return null;

  const title = titleLine.split(':').slice(1).join(':').trim();
  return title || null;
}

// Main function to rename files
function renameFilesInVault(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const title = extractTitleFromContent(content);

    if (!title) {
      console.warn(`⚠️  No title found in ${file}`);
      return;
    }

    const newFilename = `${title}.md`;
    const newFullPath = path.join(dir, newFilename);

    if (file === newFilename) {
      console.log(`✅ Already named correctly: ${file}`);
      return;
    }

    if (fs.existsSync(newFullPath)) {
      console.warn(`⚠️  Skipping rename to avoid overwrite: ${newFilename}`);
      return;
    }

    fs.renameSync(fullPath, newFullPath);
    console.log(`🔄 Renamed: ${file} → ${newFilename}`);
  });
}

// Run it
renameFilesInVault(vaultDir);

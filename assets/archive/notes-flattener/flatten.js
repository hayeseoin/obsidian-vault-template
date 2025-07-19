import fs from 'fs/promises';
import path from 'path';

class DirectoryFlattener {
  constructor(targetDir) {
    this.targetDir = targetDir;
    this.filenameCounts = new Map();
  }

  async flatten() {
    const filesToMove = await this.findNestedFiles();
    console.log(`Found ${filesToMove.length} files to migrate`);
    
    for (const fileInfo of filesToMove) {
      await this.processFile(fileInfo);
    }
    
    await this.cleanEmptyDirectories();
    console.log('Migration complete!');
  }

  async findNestedFiles(dir = this.targetDir, relativePath = '') {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const currentRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        const nestedFiles = await this.findNestedFiles(fullPath, currentRelativePath);
        files.push(...nestedFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md') && relativePath !== '') {
        // Only process .md files that are NOT in the root directory
        files.push({
          originalPath: fullPath,
          directoryPath: relativePath,
          filename: entry.name
        });
      }
    }
    
    return files;
  }

async processFile(fileInfo) {
  console.log(`Processing: ${fileInfo.directoryPath}/${fileInfo.filename}`);
  
  const stats = await fs.stat(fileInfo.originalPath);
  const originalContent = await fs.readFile(fileInfo.originalPath, 'utf-8');
  const cleanContent = this.removeFrontmatter(originalContent);
  const tags = this.generateTagsFromPath(fileInfo.directoryPath);
  const newFrontmatter = this.createFrontmatter(tags, stats.birthtime);
  const newContent = newFrontmatter + cleanContent;
  
  const newFilename = this.getUniqueFilename(fileInfo.filename);
  const newPath = path.join(this.targetDir, newFilename);
  
  await fs.writeFile(newPath, newContent);
  await fs.unlink(fileInfo.originalPath);
  
  console.log(`  → Moved to: ${newFilename}`);
}
  removeFrontmatter(content) {
    if (!content.startsWith('---')) {
      return content;
    }
    
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd === -1) {
      return content;
    }
    
    return content.slice(frontmatterEnd + 3).replace(/^\n+/, '');
  }

    generateTagsFromPath(directoryPath) {
    const pathParts = directoryPath
        .split(/[/\\]/)
        .map(part => this.normalizeTagComponent(part))
        .filter(Boolean);
    
    // Return only the complete path as a single tag
    return [pathParts.join('/')];
    }

createFrontmatter(tags, createdDate) {
  const formattedDate = createdDate.toISOString().slice(0, 19).replace('T', ' ');
  
  let frontmatter = '---\n';
  frontmatter += `created: ${formattedDate}\n`;
  frontmatter += 'tags:\n';
  for (const tag of tags) {
    frontmatter += `  - ${tag}\n`;
  }
  frontmatter += '---\n\n';
  return frontmatter;
}

getUniqueFilename(originalFilename) {
  const extension = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, extension);
  const normalizedBaseName = this.normalizeTagComponent(baseName);
  
  if (!this.filenameCounts.has(normalizedBaseName)) {
    this.filenameCounts.set(normalizedBaseName, 0);
    return `${normalizedBaseName}${extension}`;
  }
  
  const count = this.filenameCounts.get(normalizedBaseName) + 1;
  this.filenameCounts.set(normalizedBaseName, count);
  return `${normalizedBaseName}-${count}${extension}`;
}

  async cleanEmptyDirectories() {
    console.log('Cleaning up empty directories...');
    await this.removeEmptyDirs(this.targetDir);
  }

  async removeEmptyDirs(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(dir, entry.name);
        await this.removeEmptyDirs(fullPath);
        
        const remainingEntries = await fs.readdir(fullPath);
        if (remainingEntries.length === 0) {
          await fs.rmdir(fullPath);
          console.log(`Removed empty directory: ${entry.name}`);
        }
      }
    }
  }

    normalizeTagComponent(component) {
    return component
        .toLowerCase()
        .replace(/^0\d-/, '')  // Remove 0X- prefix (e.g., 02-Areas → areas)
        .replace(/\s+/g, '-')  // Convert spaces to hyphens
        .trim();
    }
}

// Usage: run from wherever you want, specify the target directory
const targetDirectory = './terminalfour'; // or whatever path you want
const flattener = new DirectoryFlattener(targetDirectory);

flattener.flatten().catch(console.error);
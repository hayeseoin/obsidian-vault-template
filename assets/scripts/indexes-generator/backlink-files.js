import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, '../../..');

class BacklinkChecker {
  constructor(vaultPath, indexDir = 'indexes') {
    this.vaultPath = vaultPath;
    this.indexDir = indexDir;
  }

  async check() {
    const files = await this.getMarkdownFiles();
    const results = [];

    for (const file of files) {
      const result = await this.checkFile(file);
      if (result.needsUpdate) {
        results.push(result);
      }
    }

    return results;
  }

  async update() {
    const files = await this.getMarkdownFiles();
    let updatedCount = 0;

    for (const file of files) {
      const result = await this.checkFile(file);
      if (result.needsUpdate) {
        await this.updateBacklinks(file, result.expectedBacklinks);
        updatedCount++;
        console.log(`Updated: ${file}`);
      }
    }

    console.log(`Updated ${updatedCount} files`);
  }

  async getMarkdownFiles() {
    const files = [];
    const entries = await fs.readdir(this.vaultPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md') && 
          !entry.name.startsWith('index') && entry.name !== 'index.md') {
        files.push(entry.name);
      }
    }
    
    return files;
  }

  async checkFile(filename) {
    const content = await fs.readFile(path.join(this.vaultPath, filename), 'utf-8');
    const tags = await this.extractTags(content);
    
    const expectedBacklinks = this.generateExpectedBacklinks(tags);
    const existingBacklinks = this.extractExistingBacklinks(content);
    
    // Check if backlinks match exactly what's expected
    const needsUpdate = !this.backlinksMatch(expectedBacklinks, existingBacklinks);

    return {
      filename,
      needsUpdate,
      expectedBacklinks,
      existingBacklinks
    };
  }

  // New method to compare expected vs existing backlinks
  backlinksMatch(expectedBacklinks, existingBacklinks) {
    if (expectedBacklinks.length !== existingBacklinks.length) {
      return false;
    }

    const expectedTexts = new Set(expectedBacklinks.map(bl => bl.backlinkText));
    
    return existingBacklinks.every(existing => expectedTexts.has(existing));
  }

  extractTags(content) {
    if (!content.startsWith('---')) {
      return [];
    }
    
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd === -1) {
      return [];
    }
    
    const frontmatter = content.slice(3, frontmatterEnd);
    return this.parseTags(frontmatter);
  }

  parseTags(frontmatter) {
    const tags = [];
    const lines = frontmatter.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      const bracketMatch = trimmed.match(/^tags:\s*\[(.*)\]$/);
      if (bracketMatch) {
        const tagList = bracketMatch[1].split(',').map(tag => 
          tag.trim().replace(/['"]/g, '')
        );
        tags.push(...tagList);
        continue;
      }
      
      if (trimmed === 'tags:') {
        continue;
      }
      
      const listMatch = trimmed.match(/^-\s*(.+)$/);
      if (listMatch) {
        const tag = listMatch[1].trim().replace(/['"]/g, '');
        tags.push(tag);
      }
    }
    
    return [...new Set(tags.filter(tag => tag.length > 0))];
  }

  generateExpectedBacklinks(tags) {
    return tags.map(tag => {
      const indexFile = `index-${tag.replace(/\//g, '-')}.md`;
      const displayName = tag.split('/').pop();
      return {
        tag,
        indexFile,
        backlinkText: `← [[${this.indexDir}/${indexFile}|Back to ${displayName}]]`
      };
    });
  }

  extractExistingBacklinks(content) {
    const lines = content.split('\n');
    const backlinks = [];
    
    // Find the end of frontmatter
    let startIndex = 0;
    if (content.startsWith('---')) {
      const frontmatterEnd = content.indexOf('---', 3);
      if (frontmatterEnd !== -1) {
        startIndex = content.slice(0, frontmatterEnd + 3).split('\n').length;
      }
    }
    
    // Look for backlinks until we hit the first heading or non-empty content
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '') continue;
      
      if (line.startsWith('#')) break; // Hit a heading, stop looking
      
      if (line.startsWith('←') && line.includes('[[')) {
        backlinks.push(line);
      } else if (line.length > 0) {
        // Hit non-backlink content, stop looking
        break;
      }
    }
    
    return backlinks;
  }

  // Renamed and updated method to handle both adding and removing
  async updateBacklinks(filename, expectedBacklinks) {
    const filePath = path.join(this.vaultPath, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Find frontmatter end
    let frontmatterEnd = 0;
    if (content.startsWith('---')) {
      const end = content.indexOf('---', 3);
      if (end !== -1) {
        frontmatterEnd = content.slice(0, end + 3).split('\n').length;
      }
    }
    
    // Remove existing backlinks and empty lines after frontmatter
    let currentIndex = frontmatterEnd;
    while (currentIndex < lines.length) {
      const line = lines[currentIndex].trim();
      
      // Stop if we hit actual content (heading or non-backlink text)
      if (line.startsWith('#') || (line.length > 0 && !line.startsWith('←'))) {
        break;
      }
      
      // Remove backlinks and empty lines
      if (line === '' || (line.startsWith('←') && line.includes('[['))) {
        lines.splice(currentIndex, 1);
      } else {
        currentIndex++;
      }
    }
    
    // Insert new backlinks if any exist
    if (expectedBacklinks.length > 0) {
      const backlinkLines = expectedBacklinks.map(bl => bl.backlinkText);
      lines.splice(frontmatterEnd, 0, ...backlinkLines, '');
    }
    
    await fs.writeFile(filePath, lines.join('\n'));
  }
}

// Usage
const checker = new BacklinkChecker(rootPath);

// To check what needs updating (dry run)
// checker.check().then(results => {
//   console.log('Files needing updates:', results.length);
//   results.forEach(r => {
//     console.log(`${r.filename}: backlinks need synchronization`);
//   });
// });

// To actually update files
checker.update().catch(console.error);
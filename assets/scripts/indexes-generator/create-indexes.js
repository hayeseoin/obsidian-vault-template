import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, '../../..');

const homeIndex = 'index.md'

class TagIndexGenerator {
 constructor(vaultPath, indexDir = 'indexes') {
   this.vaultPath = vaultPath;
   this.indexDir = path.join(vaultPath, indexDir);
   this.tagStructure = new Map();
   this.filesByTag = new Map();
 }

 async generate() {
   await this.parseVault();
   await this.createIndexDirectory();
   await this.generateIndexFiles();
 }

 async parseVault() {
   const files = await this.getMarkdownFiles();
   
   for (const file of files) {
     const tags = await this.extractTags(file);
     this.indexTags(tags, file);
   }
 }

 async getMarkdownFiles() {
   const files = [];
   const entries = await fs.readdir(this.vaultPath, { withFileTypes: true });
   
   for (const entry of entries) {
     if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('index-')) {
       files.push(entry.name);
     }
   }
   
   return files;
 }

 async extractTags(filename) {
   const content = await fs.readFile(path.join(this.vaultPath, filename), 'utf-8');
   
   // Check for frontmatter
   if (!content.startsWith('---')) {
     return [];
   }
   
   const frontmatterEnd = content.indexOf('---', 3);
   if (frontmatterEnd === -1) {
     return [];
   }
   
   const frontmatter = content.slice(3, frontmatterEnd);
   const tags = this.parseTags(frontmatter);
   
   return [...new Set(tags)]; // Remove duplicates
 }

 parseTags(frontmatter) {
   const tags = [];
   const lines = frontmatter.split('\n');
   
   for (const line of lines) {
     const trimmed = line.trim();
     
     // Handle "tags: [tag1, tag2]" format
     const bracketMatch = trimmed.match(/^tags:\s*\[(.*)\]$/);
     if (bracketMatch) {
       const tagList = bracketMatch[1].split(',').map(tag => 
         tag.trim().replace(/['"]/g, '')
       );
       tags.push(...tagList);
       continue;
     }
     
     // Handle "tags:" followed by list items
     if (trimmed === 'tags:') {
       continue;
     }
     
     // Handle list items under tags
     const listMatch = trimmed.match(/^-\s*(.+)$/);
     if (listMatch) {
       const tag = listMatch[1].trim().replace(/['"]/g, '');
       tags.push(tag);
     }
   }
   
   return tags.filter(tag => tag.length > 0);
 }

 indexTags(tags, filename) {
   for (const tag of tags) {
     // Track file associations
     if (!this.filesByTag.has(tag)) {
       this.filesByTag.set(tag, []);
     }
     this.filesByTag.get(tag).push(filename);

     // Build tag hierarchy
     const parts = tag.split('/');
     for (let i = 0; i < parts.length; i++) {
       const currentTag = parts.slice(0, i + 1).join('/');
       
       if (!this.tagStructure.has(currentTag)) {
         this.tagStructure.set(currentTag, { 
           children: new Set(), 
           parent: i > 0 ? parts.slice(0, i).join('/') : null 
         });
       }
       
       // Add to parent's children if not root
       if (i > 0) {
         const parentTag = parts.slice(0, i).join('/');
         this.tagStructure.get(parentTag).children.add(currentTag);
       }
     }
   }
 }

 async createIndexDirectory() {
   try {
     await fs.mkdir(this.indexDir, { recursive: true });
   } catch (error) {
     // Directory might already exist
   }
 }

 getFilesForTag(tag) {
   const allFiles = this.filesByTag.get(tag) || [];
   // Only show files that don't have a more specific version of this tag
   return allFiles.filter(filename => {
     const fileTags = this.filesByTag.get(tag) ? 
       Array.from(this.filesByTag.keys()).filter(t => 
         this.filesByTag.get(t).includes(filename)
       ) : [];
     
     // Check if this file has a more specific tag that starts with our tag
     const hasMoreSpecific = fileTags.some(fileTag => 
       fileTag !== tag && fileTag.startsWith(tag + '/')
     );
     return !hasMoreSpecific;
   });
 }

 async generateIndexFiles() {
   for (const [tag, structure] of this.tagStructure) {
     const content = this.buildIndexContent(tag, structure);
     const filename = `index-${tag.replace(/\//g, '-')}.md`;
     await fs.writeFile(path.join(this.indexDir, filename), content);
   }
 }

 buildIndexContent(tag, structure) {
   const displayName = tag.split('/').pop();
   let content = `# ${displayName.charAt(0).toUpperCase() + displayName.slice(1)}\n\n`;

 
   // Parent link
  if (structure.parent) {
    // Has a parent tag - link to parent index
    content += `← [[${homeIndex}|Home]]\n\n`;
    const parentFile = `index-${structure.parent.replace(/\//g, '-')}.md`;
    content += `← [[${parentFile}|${structure.parent.split('/').pop()}]]\n\n`;
  } else {
    // Root tag - link back to main index
    content += `← [[${homeIndex}|Home]]\n\n`;
  }

   // Child directories
   if (structure.children.size > 0) {
     content += `## Directories\n\n`;
     for (const child of [...structure.children].sort()) {
       const childFile = `index-${child.replace(/\//g, '-')}.md`;
       const childName = child.split('/').pop();
       content += `- [[${childFile}|${childName}]]\n`;
     }
     content += '\n';
   }

   // Files with this tag (not including child tag files)
   const files = this.getFilesForTag(tag);
   if (files.length > 0) {
     content += `## Files\n\n`;
     for (const file of files.sort()) {
       const displayName = file.replace('.md', '');
       content += `- [[${file}|${displayName}]]\n`;
     }
   }

   return content;
 }
}

// Usage


const generator = new TagIndexGenerator(rootPath);
generator.generate().catch(console.error);

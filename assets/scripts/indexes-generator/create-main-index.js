import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, '../../..');

class MainIndexGenerator {
    constructor(vaultPath, indexDir = 'indexes') {
        this.vaultPath = vaultPath;
        this.indexDir = path.join(vaultPath, indexDir);
        this.tagHierarchy = new Map(); // Full tag path -> { files: Set(), children: Set() }
        this.untaggedFiles = [];
        this.favouriteFiles = []; 
    }

    async generate() {
        await this.buildTagHierarchy();
        await this.createMainIndex();
    }

    async buildTagHierarchy() {
        const files = await this.getMarkdownFiles();
        
        for (const file of files) {
            const frontmatterData = await this.extractFrontmatter(file);
            
            if (frontmatterData.favourite) {
                this.favouriteFiles.push(file);
            }
            
            if (frontmatterData.tags.length === 0) {
                this.untaggedFiles.push(file);
                continue;
            }

            for (const tag of frontmatterData.tags) {
                this.addTagToHierarchy(tag, file);
            }
        }
    }

    addTagToHierarchy(fullTag, filename) {
        const parts = fullTag.split('/');
        
        // Create hierarchy entries for each level
        for (let i = 0; i < parts.length; i++) {
            const currentPath = parts.slice(0, i + 1).join('/');
            
            if (!this.tagHierarchy.has(currentPath)) {
                this.tagHierarchy.set(currentPath, {
                    files: new Set(),
                    children: new Set()
                });
            }

            // Add file to the exact tag it has
            if (currentPath === fullTag) {
                this.tagHierarchy.get(currentPath).files.add(filename);
            }

            // Add parent-child relationship
            if (i > 0) {
                const parentPath = parts.slice(0, i).join('/');
                const childName = parts[i];
                this.tagHierarchy.get(parentPath).children.add(childName);
            }
        }
    }

    async getMarkdownFiles() {
        const files = [];
        const entries = await fs.readdir(this.vaultPath, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('index')) {
                files.push(entry.name);
            }
        }
        return files;
    }

    async extractFrontmatter(filename) {
        const content = await fs.readFile(path.join(this.vaultPath, filename), 'utf-8');
        
        if (!content.startsWith('---')) {
            return { tags: [], favourite: false };
        }

        const frontmatterEnd = content.indexOf('---', 3);
        if (frontmatterEnd === -1) {
            return { tags: [], favourite: false };
        }

        const frontmatter = content.slice(3, frontmatterEnd);
        return this.parseFrontmatter(frontmatter);
    }

    parseFrontmatter(frontmatter) {
        const result = { tags: [], favourite: false };
        const lines = frontmatter.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Check for favourite field (handles both spellings and quoted/unquoted)
            const favouriteMatch = trimmed.match(/^favourites?:\s*["']?true["']?$/i);
            if (favouriteMatch) {
                result.favourite = true;
                continue;
            }
            
            // Tag parsing - bracket format
            const bracketMatch = trimmed.match(/^tags:\s*\[(.*)\]$/);
            if (bracketMatch) {
                const tagList = bracketMatch[1].split(',').map(tag =>
                    tag.trim().replace(/['"]/g, '')
                );
                result.tags.push(...tagList);
                continue;
            }

            // Skip tags: line
            if (trimmed === 'tags:') {
                continue;
            }

            // Tag parsing - list format
            const listMatch = trimmed.match(/^-\s*(.+)$/);
            if (listMatch) {
                const tag = listMatch[1].trim().replace(/['"]/g, '');
                result.tags.push(tag);
            }
        }
        
        result.tags = result.tags.filter(tag => tag.length > 0);
        return result;
    }

    async createMainIndex() {
        await fs.mkdir(this.indexDir, { recursive: true });

        const projectsTitle = `🚀 [[indexes/index-projects.md|Projects]]`
        const resourcesTitle = `📚 [[indexes/index-resources.md|Resources]]`
        const archiveTitle = `📦 [[indexes/index-archive.md|Archive]]`

        const recentFilesQuery = `dv.list(
            dv.pages()
              .where(p => !p.file.name.startsWith('index'))
              .sort(p => p.file.mtime, 'desc')
              .limit(5)
              .map(p => p.file.link)
        );`;
    
        
        let content = '# Main Index\n\n';
        
        // Projects section
        if (this.tagHierarchy.has('projects')) {
            content += `## ${projectsTitle}\n\n`;
            content += this.buildSpecialSection('projects');
        }

        // Resources section
        if (this.tagHierarchy.has('resources')) {
            content += `## ${resourcesTitle}\n\n`;
            content += this.buildSpecialSection('resources');
        }

        // Dividing line
        content += `\n---\n`

        // Favourites section
        if (this.favouriteFiles.length > 0) {
            content += '## ⭐ Favourites\n\n';
            for (const file of this.favouriteFiles.sort()) {
                const name = file.replace('.md', '');
                content += `- [[${file}|${name}]]\n`;
            }
            // Dividing line
            content += `\n---\n`
        }

        // Other root tags
        const rootTags = this.getRootTags();
        const otherTags = rootTags.filter(tag => !['projects', 'resources', 'archive'].includes(tag));
        
        if (otherTags.length > 0) {
            content += '## 🏷️ Other Categories\n\n';
            for (const tag of otherTags.sort()) {
                content += `## [[indexes/index-${tag}.md|${tag}]]\n`;
            }
            
            // Dividing line
            content += `\n---\n`
        }

        // Uncategorized
        if (this.untaggedFiles.length > 0) {
            // Dividing line
            content += '## 🧦 Uncategorized\n\n';
            for (const file of this.untaggedFiles.sort()) {
                const name = file.replace('.md', '');
                content += ` - [[${file}|${name}]]\n`;
            }
            // Dividing line
            content += `\n---\n`
        }

        content += '## 🕐 Recently Edited\n\n';
        content += this.buildDataviewQuery(recentFilesQuery);

        // Resources section
        if (this.tagHierarchy.has('archive')) {
            // Dividing line
            content += `---\n`
            content += `## ${archiveTitle}\n\n`;
        }
            
        content += '\n';        
        const mainIndexPath = path.join(this.vaultPath, 'index.md');

        await fs.writeFile(mainIndexPath, content);
        console.log('Main index created at index.md');
    }

    buildSpecialSection(rootTag) {
        const tagData = this.tagHierarchy.get(rootTag);
        let content = '';

        // Directories (child tags)
        if (tagData.children.size > 0) {
            const sortedChildren = [...tagData.children].sort();
            for (const child of sortedChildren) {
                content += ` - [[indexes/index-${rootTag}-${child}.md|${child}]]\n`;
            }
            content += '';
        }

        // Files (directly tagged with this root tag)
        if (tagData.files.size > 0) {
            content += '\n\n';
            const sortedFiles = [...tagData.files].sort();
            for (const file of sortedFiles) {
                const name = file.replace('.md', '');
                content += `[[${file}]]\n`;
            }
            content += '\n';
        }

        return content;
    }

    getRootTags() {
        const roots = new Set();
        for (const tag of this.tagHierarchy.keys()) {
            const rootTag = tag.split('/')[0];
            roots.add(rootTag);
        }
        return [...roots];
    }

  buildDataviewQuery(query) {
      return `\`\`\`dataviewjs\n${query}\n\`\`\`\n\n`;
    }
}

const generator = new MainIndexGenerator(rootPath);
generator.generate().catch(console.error);
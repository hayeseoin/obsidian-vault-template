import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const VAULT_PATH = '../..'; // Update this path

async function removeHardcodedLinks() {
  try {
    const files = await readdir(VAULT_PATH, { recursive: true });
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    let processedCount = 0;
    
    for (const file of markdownFiles) {
      const filePath = join(VAULT_PATH, file);
      const content = await readFile(filePath, 'utf8');
      
      // Split content into frontmatter and body
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = content.match(frontmatterRegex);
      
      if (!match) continue; // Skip files without frontmatter
      
      const [, frontmatter, body] = match;
      
      // Remove hard-coded links (lines starting with ← [[)
      const cleanedBody = body
        .split('\n')
        .filter(line => !line.trim().startsWith('← [['))
        .join('\n')
        .replace(/^\n+/, ''); // Remove leading empty lines
      
      // Only write if content changed
      if (body !== cleanedBody) {
        const newContent = `---\n${frontmatter}\n---\n${cleanedBody}`;
        await writeFile(filePath, newContent, 'utf8');
        processedCount++;
        console.log(`Processed: ${file}`);
      }
    }
    
    console.log(`\nCompleted! Processed ${processedCount} files.`);
    
  } catch (error) {
    console.error('Error processing files:', error.message);
  }
}

removeHardcodedLinks();
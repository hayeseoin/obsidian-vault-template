const fs = require('fs').promises;
const path = require('path');

const notesDirectory = '../../..';
const templatePath = '../../../assets/templates/dataview/dv-top-nav.md';

/**
* Loads the complete template content
* @param {string} templatePath - Path to template file
* @returns {Promise<string>} Complete template content
*/
async function loadTemplate(templatePath) {
 const content = await fs.readFile(templatePath, 'utf8');
 return content.trim();
}

/**
* Gets all markdown files in directory (non-recursive)
* @param {string} notesDirectory - Path to notes directory
* @returns {Promise<string[]>} Array of markdown file paths
*/
async function getMarkdownFiles(notesDirectory) {
 const files = await fs.readdir(notesDirectory);
 return files
   .filter(file => file.endsWith('.md'))
   .map(file => path.join(notesDirectory, file));
}

/**
* Inserts template after frontmatter if frontmatter exists
* @param {string} content - File content
* @param {string} templateContent - Template content to insert
* @returns {string} Updated content
*/
function insertTemplateAfterFrontmatter(content, templateContent) {
 const lines = content.split('\n');
 
 // Check if file starts with frontmatter
 if (!lines[0] || lines[0].trim() !== '---') {
   return content; // No frontmatter, skip
 }
 
 // Find closing frontmatter
 let frontmatterEnd = -1;
 for (let i = 1; i < lines.length; i++) {
   if (lines[i].trim() === '---') {
     frontmatterEnd = i;
     break;
   }
 }
 
 if (frontmatterEnd === -1) {
   return content; // Malformed frontmatter, skip
 }
 
 // Insert template after frontmatter (with blank line separation)
 const templateLines = templateContent.split('\n');
 lines.splice(frontmatterEnd + 1, 0, ...templateLines);
 
 return lines.join('\n');
}

/**
* Main function
*/
async function insertTemplateInAllNotes(notesDirectory, templatePath) {
 const templateContent = await loadTemplate(templatePath);
 const markdownFiles = await getMarkdownFiles(notesDirectory);
 
 let modifiedCount = 0;
 
 for (const filePath of markdownFiles) {
   try {
     const content = await fs.readFile(filePath, 'utf8');
     const updatedContent = insertTemplateAfterFrontmatter(content, templateContent);
     
     if (content !== updatedContent) {
       await fs.writeFile(filePath, updatedContent, 'utf8');
       modifiedCount++;
       console.log(`Updated: ${path.basename(filePath)}`);
     }
   } catch (error) {
     console.error(`Error processing ${path.basename(filePath)}: ${error.message}`);
   }
 }
 
 console.log(`Modified ${modifiedCount} files`);
}

insertTemplateInAllNotes(notesDirectory, templatePath);
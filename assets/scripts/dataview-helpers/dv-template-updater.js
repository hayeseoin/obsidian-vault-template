const fs = require('fs').promises;
const path = require('path');
//
/**
* Parses command line arguments
* @returns {Object} Parsed arguments
*/
function parseArgs() {
 const args = process.argv.slice(2);
 const parsed = {};
 
 args.forEach(arg => {
   const [key, value] = arg.split('=');
   if (key && value) {
     parsed[key] = value;
   }
 });
 
 return parsed;
}

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
* Extracts template path from a DV_TEMPLATE_START comment line
* @param {string} line - The comment line
* @returns {string|null} Template path or null if not found
*/
function extractTemplatePath(line) {
 const match = line.match(/\/\/ DV_TEMPLATE_START (.+)/);
 return match ? match[1].trim() : null;
}

/**
* Replaces template sections that match the target template
* @param {string} content - File content
* @param {string} templateContent - New template content
* @param {string} targetTemplatePath - Template path to match
* @returns {string} Updated content
*/
function replaceMatchingTemplates(content, templateContent, targetTemplatePath) {
 const startMarker = '// DV_TEMPLATE_START';
 const endMarker = '// DV_TEMPLATE_END';
 
 const lines = content.split('\n');
 const templateLines = templateContent.split('\n');
 let modified = false;
 
 // Process from end to start to maintain indices
 for (let i = lines.length - 1; i >= 0; i--) {
   if (lines[i].includes(startMarker)) {
     // Check if this template matches our target
     const templatePath = extractTemplatePath(lines[i]);
     if (templatePath !== targetTemplatePath) {
       continue; // Skip non-matching templates
     }
     
     // Find corresponding end marker
     let endIndex = -1;
     for (let j = i + 1; j < lines.length; j++) {
       if (lines[j].includes(endMarker)) {
         endIndex = j;
         break;
       }
     }
     
     if (endIndex === -1) {
       continue; // Skip malformed template
     }
     
     // Calculate boundaries
     const replaceStart = i - 2;
    // const replaceStart = (i >= 2) ? i - 2 : i - 1;
     const replaceEnd = endIndex + 2;
     
     // Check for frontmatter collision
     if (replaceStart >= 0 && lines[replaceStart].includes('---')) {
       throw new Error('FRONTMATTER_COLLISION');
     }
     
     // Replace the section
     lines.splice(replaceStart, replaceEnd - replaceStart + 1, ...templateLines);
     modified = true;
   }
 }
 
 return modified ? lines.join('\n') : content;
}

/**
* Main function
*/
async function updateTemplates() {
 const args = parseArgs();
 
 if (!args.template) {
   console.error('Usage: node script.js template=assets/templates/dataview/something.md');
   process.exit(1);
 }
 
 const notesDirectory = '../../..'; // Adjust this to your notes directory
 const templatePath = args.template;
 const templateFilePath = path.join(notesDirectory, templatePath);
 
 console.log(`Loading template: ${templatePath}`);
 console.log(`From file: ${templateFilePath}`);
 
 try {
   const templateContent = await loadTemplate(templateFilePath);
   const markdownFiles = await getMarkdownFiles(notesDirectory);
   
   let modifiedCount = 0;
   
   for (const filePath of markdownFiles) {
     try {
       const content = await fs.readFile(filePath, 'utf8');
       const updatedContent = replaceMatchingTemplates(content, templateContent, templatePath);
       
       if (content !== updatedContent) {
         await fs.writeFile(filePath, updatedContent, 'utf8');
         modifiedCount++;
         console.log(`Updated: ${path.basename(filePath)}`);
       }
     } catch (error) {
       if (error.message === 'FRONTMATTER_COLLISION') {
         console.warn(`Skipped ${path.basename(filePath)}: template would overwrite frontmatter`);
       } else {
         console.error(`Error processing ${path.basename(filePath)}: ${error.message}`);
       }
     }
   }
   
   console.log(`Modified ${modifiedCount} files`);
   
 } catch (error) {
   console.error(`Failed to load template: ${error.message}`);
   process.exit(1);
 }
}

updateTemplates();
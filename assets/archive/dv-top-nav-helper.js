import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const VAULT_PATH = '../../..'; 
const TEMPLATE_FILE = 'assets/templates/dataview/dv-top-nav-replacer.md';

// Add force mode flag
const FORCE_MODE = process.argv.includes('--force');

async function loadTemplate() {
    try {
        const templatePath = join(VAULT_PATH, TEMPLATE_FILE);
        const templateContent = await readFile(templatePath, 'utf8');
        
        // Extract the marker from the template for dynamic detection
        const markerMatch = templateContent.match(/\/\/ DATAVIEW_TEMPLATE_START ([^\n]+)/);
        if (!markerMatch) {
            throw new Error('Template must contain a START marker comment');
        }
        
        const marker = markerMatch[0]; // Full "// DATAVIEW_TEMPLATE_START ..." line
        const templateId = markerMatch[1]; // Just the path part
        
        return { templateContent, marker, templateId };
        
    } catch (error) {
        throw new Error(`Failed to load template: ${error.message}`);
    }
}

async function upsertDataviewTemplate() {
    try {
        const { templateContent, marker, templateId } = await loadTemplate();
        console.log(`📖 Loaded template: ${templateId}`);
        
        if (FORCE_MODE) {
            console.log('🔧 Force mode enabled - will update all files');
        }
        
        const files = await readdir(VAULT_PATH);
        const markdownFiles = files.filter(file => 
            file.endsWith('.md') && !file.includes('dv-top-nav')
        );
        
        let insertedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const file of markdownFiles) {
            const filePath = join(VAULT_PATH, file);
            const content = await readFile(filePath, 'utf8');
            
            // Check for frontmatter
            const frontmatterMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
            if (!frontmatterMatch) {
                console.warn(`⚠️ No frontmatter in: ${file}`);
                skippedCount++;
                continue;
            }
            
            const [, frontmatter, restOfContent] = frontmatterMatch;
            const hasExistingTemplate = content.includes(marker);
            
            let newContent;
            
            if (hasExistingTemplate) {
                // Update existing template
                try {
                    const { updatedContent, wasChanged } = replaceTemplate(content, marker, templateContent, frontmatter);
                    
                    if (!FORCE_MODE && !wasChanged) {
                        skippedCount++;
                        continue;
                    }
                    
                    newContent = updatedContent;
                    updatedCount++;
                    console.log(`🔄 ${FORCE_MODE ? 'Force updated' : 'Updated'}: ${file}`);
                    
                } catch (replaceError) {
                    console.error(`❌ Error updating ${file}: ${replaceError.message}`);
                    errorCount++;
                    continue;
                }
                
            } else {
                // Insert new template (starts with title line)
                newContent = frontmatter + templateContent + '\n' + restOfContent;
                insertedCount++;
                console.log(`➕ Inserted: ${file}`);
            }
            
            await writeFile(filePath, newContent, 'utf8');
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   ➕ Inserted: ${insertedCount} files`);
        console.log(`   🔄 Updated: ${updatedCount} files`);
        console.log(`   ⏭️ Skipped: ${skippedCount} files`);
        console.log(`   ❌ Errors: ${errorCount} files`);
        console.log(`   📁 Total processed: ${markdownFiles.length} files`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function replaceTemplate(content, startMarker, newTemplate, frontmatter) {
    // Find the END marker that corresponds to our START marker
    const endMarker = startMarker.replace('DATAVIEW_TEMPLATE_START', 'DATAVIEW_TEMPLATE_END');

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
        throw new Error('Could not find complete template boundaries');
    }
    
    // Find the dataviewjs codeblock containing our markers
    const beforeStart = content.substring(0, startIndex);
    const codeblockStart = beforeStart.lastIndexOf('```dataviewjs');
    
    if (codeblockStart === -1) {
        throw new Error('Could not find dataviewjs codeblock start');
    }
    
    // Find the title line by looking backwards from the codeblock start
    // Look for a line that starts with # (markdown header)
    const beforeCodeblock = content.substring(0, codeblockStart).trimEnd();
    const lines = beforeCodeblock.split('\n');
    
    let titleLineIndex = -1;
    // Search backwards from the end to find the title line
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('#')) {
            titleLineIndex = i;
            break;
        }
        // If we hit a non-empty, non-whitespace line that's not a title, stop
        if (line && !line.match(/^\s*$/)) {
            break;
        }
    }
    
    if (titleLineIndex === -1) {
        throw new Error('Could not find title line (line starting with #) before dataviewjs block');
    }
    
    // Calculate the actual character position of the title line start
    const titleLineStart = lines.slice(0, titleLineIndex).join('\n').length + 
                          (titleLineIndex > 0 ? 1 : 0); // +1 for newline if not first line
    
    // CRITICAL SAFETY CHECK: Ensure we're not trying to replace frontmatter
    const frontmatterEnd = frontmatter.length;
    
    if (titleLineStart < frontmatterEnd) {
        throw new Error('Template corruption detected: title line appears to be in frontmatter');
    }
    
    // Find end of template (end of codeblock after END marker)
    const afterEnd = content.substring(endIndex + endMarker.length);
    const codeblockEndMatch = afterEnd.match(/\n```/);
    
    if (!codeblockEndMatch) {
        throw new Error('Could not find end of dataviewjs codeblock');
    }
    
    const templateEnd = endIndex + endMarker.length + codeblockEndMatch.index + 4; // +4 for "\n```"
    
    // Look for trailing newlines to include in replacement
    const afterCodeblock = content.substring(templateEnd);
    const trailingNewlines = afterCodeblock.match(/^(\n+)/);
    const finalTemplateEnd = trailingNewlines ? 
        templateEnd + trailingNewlines[1].length : 
        templateEnd;
    
    const existingTemplate = content.substring(titleLineStart, finalTemplateEnd);
    const wasChanged = existingTemplate.trim() !== newTemplate.trim();
    
    const updatedContent = content.substring(0, titleLineStart) + 
                          newTemplate + 
                          content.substring(finalTemplateEnd);
    
    return { updatedContent, wasChanged };
}

upsertDataviewTemplate();
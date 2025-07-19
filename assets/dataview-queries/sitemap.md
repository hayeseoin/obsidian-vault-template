```dataviewjs
// Build tag hierarchy and file mappings
const tagHierarchy = new Map();
const filesByTag = new Map();
const indexesDirectory = "indexes"

// Process all files
for (const file of dv.pages('""').where(p => 
 p.file.name !== "full-index" && 
 !p.file.name.startsWith("index-")
)) {
 const tags = file.file.tags || [];
 
 for (const tag of tags) {
   // Add file to this tag
   if (!filesByTag.has(tag)) {
     filesByTag.set(tag, []);
   }
   filesByTag.get(tag).push(file);
   
   // Build hierarchy
   const parts = tag.split('/');
   if (parts.length === 1) {
     // Root tag
     if (!tagHierarchy.has(tag)) {
       tagHierarchy.set(tag, new Set());
     }
   } else {
     // Nested tag - add to parent's children
     const rootTag = parts[0];
     if (!tagHierarchy.has(rootTag)) {
       tagHierarchy.set(rootTag, new Set());
     }
     tagHierarchy.get(rootTag).add(tag);
   }
 }
}

// Helper function to get files that should appear at a specific tag level
function getFilesForTag(tag) {
 const allFiles = filesByTag.get(tag) || [];
 // Only show files that don't have a more specific version of this tag
 return allFiles.filter(file => {
   const fileTags = file.file.tags || [];
   // Check if this file has a more specific tag that starts with our tag
   const hasMoreSpecific = fileTags.some(fileTag => 
     fileTag !== tag && fileTag.startsWith(tag + '/')
   );
   return !hasMoreSpecific;
 });
}

// Render the hierarchy
dv.header(1, "Full Vault Index");

for (const [rootTag, childTags] of [...tagHierarchy.entries()].sort()) {
 const rootIndexFile = `${indexesDirectory}/index-${rootTag.replace(/^#/, '')}.md`;
 dv.header(2, `[[${rootIndexFile}|${rootTag.replace(/^#/, '')}]]`);
 
 // Files directly tagged with root tag (not having more specific versions)
 const rootFiles = getFilesForTag(rootTag);
 if (rootFiles.length > 0) {
   for (const file of rootFiles.sort((a, b) => a.file.name.localeCompare(b.file.name))) {
     dv.paragraph(`-- [[${file.file.name}|${file.file.name.replace('.md', '')}]]`);
   }
 }
 
 // Child tags and their files
 for (const childTag of [...childTags].sort()) {
   const childName = childTag.split('/').slice(1).join('/');
   const childIndexFile = `${indexesDirectory}/index-${childTag.replace(/\//g, '-').replace(/^#/, '')}.md`;
   dv.header(4, `[[${childIndexFile}|${childName}]]`);
   
   const childFiles = getFilesForTag(childTag);
   for (const file of childFiles.sort((a, b) => a.file.name.localeCompare(b.file.name))) {
     dv.paragraph(`-- [[${file.file.name}|${file.file.name.replace('.md', '')}]]`);
   }
 }
 
 dv.paragraph(""); // Add spacing between sections
}

// Handle files with no tags
const untaggedFiles = dv.pages('""')
 .where(p => 
   p.file.name !== "full-index" && 
   !p.file.name.startsWith("index-") &&
   (!p.file.tags || p.file.tags.length === 0)
 )
 .sort(p => p.file.name);

if (untaggedFiles.length > 0) {
 dv.header(2, "Untagged Files");
 for (const file of untaggedFiles) {
   dv.paragraph(`-- [[${file.file.name}|${file.file.name.replace('.md', '')}]]`);
 }
}


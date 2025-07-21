// const template_version = "0.9.0"

// const current = dv.current();

// // Get tags from frontmatter (plain array) or file tags (dataview object)
// let currentTags = current.tags || []; // frontmatter tags are plain array
// if (current.file.etags && current.file.etags.values) {
//     // Merge with file tags, removing # prefix
//     const fileTags = current.file.etags.values.map(tag => tag.replace('#', ''));
//     currentTags = [...new Set([...currentTags, ...fileTags])]; // deduplicate
// }

// if (currentTags.length === 0) {
//     dv.paragraph("No tags found in this note.");
// } else {
//     // Find the most nested tag (longest path)
//     const mostNestedTag = currentTags.reduce((longest, tag) => 
//         tag.length > longest.length ? tag : longest, ""
//     );

//     // Get all pages with the exact same tag
//     const siblings = dv.pages(`#${mostNestedTag}`)
//         .where(p => p.file.name !== current.file.name) // Exclude current file
//         .sort(p => p.file.name);

//     if (siblings.length > 0) {
//         let siblingContent = "";
//         siblings.forEach(page => {
//             siblingContent += `> - [[${page.file.name}]]\n`;
//         });
        
//         dv.paragraph(siblingContent.trim());
//     } else {
//         dv.paragraph("No sibling notes found.");
//     }
// }

const current = dv.current();

// Normalize and deduplicate tags
const frontmatterTags = Array.isArray(current.tags) ? current.tags : [];
const etags = current.file.etags?.values.map(t => t.replace(/^#/, '')) || [];

const currentTags = [...new Set([...frontmatterTags, ...etags])];

if (currentTags.length === 0) {
    dv.paragraph("No tags found in this note.");
} else {
    for (const tag of currentTags.sort()) {
        // Find pages sharing this tag (excluding current)
        const siblings = dv.pages()
            .where(p => {
                if (p.file.name === current.file.name) return false;

                const pageTags = new Set([
                    ...(Array.isArray(p.tags) ? p.tags : []),
                    ...(p.file.etags?.values.map(t => t.replace(/^#/, '')) || [])
                ]);

                return pageTags.has(tag);
            })
            .sort(p => p.file.name);

        if (siblings.length > 0) {
            if (currentTags.length > 1){
                dv.paragraph(`\`${tag}\``);
            }
            dv.list(siblings.map(p => `[[${p.file.name}]]`));
        }
    }
}

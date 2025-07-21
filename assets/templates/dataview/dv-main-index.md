```dataviewjs
// START assets/templates/dataview/dv-main-index.md
const template_version = "0.9.0"
// === UTILITY FUNCTIONS "===
function parseFrontmatter(page) {
    const tags = page.tags || [];
    const favourite = page.favourite === "true" || page.favorites === "true";
    return { 
        tags: tags
            .filter(t => t != null) // Filter out null/undefined values
            .map(t => t.toString().replace('#', '')), 
        favourite 
    };
}

function buildTagHierarchy(pages) {
    const hierarchy = new Map();
    const untaggedFiles = [];
    const favouriteFiles = [];
    
    for (const page of pages) {
        const { tags, favourite } = parseFrontmatter(page);
        
        if (favourite) {
            favouriteFiles.push(page);
        }
        
        if (tags.length === 0) {
            untaggedFiles.push(page);
            continue;
        }
        
        for (const fullTag of tags) {
            addTagToHierarchy(hierarchy, fullTag, page);
        }
    }
    
    return { hierarchy, untaggedFiles, favouriteFiles };
}

function addTagToHierarchy(hierarchy, fullTag, page) {
    const parts = fullTag.split('/');
    
    // Create hierarchy entries for each level
    for (let i = 0; i < parts.length; i++) {
        const currentPath = parts.slice(0, i + 1).join('/');
        
        if (!hierarchy.has(currentPath)) {
            hierarchy.set(currentPath, {
                files: new Set(),
                children: new Set()
            });
        }
        
        // Add parent-child relationship
        if (i > 0) {
            const parentPath = parts.slice(0, i).join('/');
            const childName = parts[i];
            hierarchy.get(parentPath).children.add(childName);
        }
    }
    
    // Only add file to its most specific tag level
    hierarchy.get(fullTag).files.add(page);
}

function getRootTags(hierarchy) {
    const roots = new Set();
    for (const tag of hierarchy.keys()) {
        const rootTag = tag.split('/')[0];
        roots.add(rootTag);
    }
    return [...roots].sort();
}

function buildSpecialSection(hierarchy, rootTag) {
    const tagData = hierarchy.get(rootTag);
    if (!tagData) return "";
    
    let content = "";
    
    // Child categories
    if (tagData.children.size > 0) {
        const sortedChildren = [...tagData.children].sort();
        for (const child of sortedChildren) {
            content += ` - [[indexes/index-${rootTag}-${child}.md|${child}]]\n`;
        }
        content += "\n";
    }
    
    // Direct files (only those tagged exactly with this root tag)
    if (tagData.files.size > 0) {
        content += "\n";
        const sortedFiles = [...tagData.files]
            .sort((a, b) => a.file.name.localeCompare(b.file.name));
        for (const page of sortedFiles) {
            content += `[[${page.file.name}]]\n`;
        }
    }
    
    return content;
}

// === MAIN EXECUTION ===
const pages = dv.pages('""') // Read only from root
    .where(p => !p.file.name.startsWith('index'))
    .where(p => !p.file.folder || p.file.folder === "") // Ensure truly root level only
    .array();

const { hierarchy, untaggedFiles, favouriteFiles } = buildTagHierarchy(pages);
const rootTags = getRootTags(hierarchy);
const otherTags = rootTags.filter(tag => !['projects', 'resources', 'archive'].includes(tag));

// // === RENDER INDEX ===
// dv.header(1, "Main Index");

// Projects Section
if (hierarchy.has('projects')) {
    dv.header(2, "🚀 [[indexes/index-projects.md|Projects]]");
    dv.paragraph(buildSpecialSection(hierarchy, 'projects'));
}

// Resources Section
if (hierarchy.has('resources')) {
    dv.header(2, "📚 [[indexes/index-resources.md|Resources]]");
    dv.paragraph(buildSpecialSection(hierarchy, 'resources'));
}

// Divider
dv.el("hr", "");

// Favourites Section
if (favouriteFiles.length > 0) {
    dv.header(2, "⭐ Favourites");
    const sortedFavs = favouriteFiles
        .sort((a, b) => a.file.name.localeCompare(b.file.name))
        .map(page => `[[${page.file.name}]]`);
    dv.list(sortedFavs);
    dv.el("hr", "");
}

// Other Categories
if (otherTags.length > 0) {
   dv.header(2, "🏷️ Other Categories");
   for (const tag of otherTags) {
       dv.header(3, `[[indexes/index-${tag}.md|${tag}]]`);
   }
   dv.el("hr", "");
}

// Uncategorized
if (untaggedFiles.length > 0) {
    dv.header(2, "🧦 Uncategorized");
    const sortedUntagged = untaggedFiles
        .sort((a, b) => a.file.name.localeCompare(b.file.name))
        .map(page => `[[${page.file.name}]]`);
    dv.list(sortedUntagged);
    dv.el("hr", "");
}

// Recently Edited
dv.header(2, "🕐 Recently Edited");
dv.list(
    dv.pages('""')
        .where(p => !p.file.name.startsWith('index'))
        .where(p => !p.file.folder || p.file.folder === "") // Root level only
        .sort(p => p.file.mtime, 'desc')
        .limit(5)
        .map(p => p.file.link)
);

// Archive Section
if (hierarchy.has('archive')) {
    dv.el("hr", "");
    dv.header(2, "📦 [[indexes/index-archive.md|Archive]]");
}
//END assets/templates/dataview/dv-main-index.md

```



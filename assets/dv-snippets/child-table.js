const template_version = "0.9.0";
const current = dv.current();

// Utility: Merge frontmatter and file etags into one clean, deduplicated array
function getSafeTags(frontmatterTags, fileEtags) {
    let tags = Array.isArray(frontmatterTags) ? [...frontmatterTags] : [];

    if (fileEtags?.values) {
        const cleanedFileTags = fileEtags.values
            .filter(tag => typeof tag === "string" && tag.trim() !== "")
            .map(tag => tag.replace(/^#/, '')); // remove leading #
        tags = [...new Set([...tags, ...cleanedFileTags])]; // deduplicate
    }

    return tags;
}

// Step 1: Get tags from the current note
let currentTags = getSafeTags(current.tags, current.file?.etags);

if (currentTags.length === 0) {
    dv.paragraph("No tags found in this note.");
} else {
    // Step 2: Find the most nested tag (longest)
    const mostNestedTag = currentTags.reduce((longest, tag) =>
        tag.length > longest.length ? tag : longest, "");

    // Step 3: Prepare to group all other pages by immediate child tags
    const childPattern = `${mostNestedTag}/`;
    const children = {};
    const allPages = dv.pages();

    allPages.forEach(page => {
        const pageTags = getSafeTags(page.tags, page.file?.etags);

        pageTags.forEach(tag => {
            // Gracefully skip invalid tags
            if (typeof tag !== "string" || !tag.startsWith(childPattern)) return;

            // Extract immediate child tag (one level deeper)
            const childTag = tag
                .split('/')
                .slice(0, mostNestedTag.split('/').length + 1)
                .join('/');

            (children[childTag] ??= []).push(page);
        });
    });

    // Step 4: Output results
    if (Object.keys(children).length > 0) {
        let childContent = "";

        Object.keys(children).sort().forEach(childTag => {
            const tagSuffix = childTag.split('/').pop();
            childContent += `**${tagSuffix}**\n`;

            // Deduplicate and sort by filename
            const uniquePages = [...new Map(
                children[childTag].map(p => [p.file.name, p])
            ).values()];

            uniquePages.sort((a, b) => a.file.name.localeCompare(b.file.name))
                .forEach(page => {
                    childContent += ` - [[${page.file.name}]]\n`;
                });
            childContent += "\n"
        });

        dv.paragraph(childContent.trim());
    } else {
        dv.paragraph("No child notes found.");
    }
}

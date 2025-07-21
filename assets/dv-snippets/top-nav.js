const page = dv.current();

if (!page || !page.tags || page.tags.length === 0) {
    dv.paragraph("[[index.md|←Home]]");
    return;
}

// dv.header(4, "Index")
// Convert tags to navigation links
const navLinks = page.tags.map(tag => {
    const fileName = "index-" + tag.replace(/\//g, "-");
    const displayText = `←${tag}`;
    return `[[${fileName}|${displayText}]]`;
});

dv.paragraph(navLinks.join(" • "));
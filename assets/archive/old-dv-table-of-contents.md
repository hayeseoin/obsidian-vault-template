###### → Contents
```dataviewjs
// DATAVIEW_TEMPLATE_START assets/templates/dataview/dv-table-of-contents.md
const template_version = "0.9.2"

const content = await dv.io.load(dv.current().file.path);
const headingRegex = /^(#{1,6})\s+(.+)$/gm;
const headings = [];
let match;
let isFirstH6 = true;
let isFirstH1 = true;

while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    
    if (level === 6 && isFirstH6) {
        isFirstH6 = false;
        continue;
    }
    
    if (level === 1 && isFirstH1) {
        isFirstH1 = false;
        continue;
    }
    
    if (text === "→ Contents") {
        continue;
    }
    headings.push({
        level: level,
        text: text
    });
}

if (headings.length > 0) {
    const minLevel = Math.min(...headings.map(h => h.level));
    
    // let tocContent = "> **###### → Contents**\n";
    let tocContent = "";
    headings.forEach(h => {
        const indentLevel = h.level - minLevel;
        const indent = "  ".repeat(indentLevel);
        tocContent += `> ${indent}- [[#${h.text}|${h.text}]]\n`;
    });
    
    dv.paragraph(tocContent.trim());
} else {
    dv.paragraph("No headings found for table of contents.");
}
// DATAVIEW_TEMPLATE_END assets/templates/dataview/dv-table-of-contents.md

```
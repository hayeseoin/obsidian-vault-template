---
tags:
  - assets
---
```dataviewjs
await null
const activeFile = app.workspace.getActiveFile();
if (!activeFile) {
  dv.paragraph("❌ No active file");
  return;
}

const page = dv.page(activeFile.path);
if (!page || !page.tags || page.tags.length === 0) {
  dv.paragraph("⚠️ No tags found on this page.");
  return;
}

// Use the first tag as base tag
const baseTag = page.tags[0].split("/")[0];

// Get all pages tagged with baseTag or any nested tag starting with baseTag/
const relatedPages = dv.pages(`#${baseTag}`)
  .where(p => {
    // Find tags starting exactly with baseTag or baseTag/something
    return p.tags && p.tags.some(t => t === baseTag || t.startsWith(baseTag + "/"));
  });

// Collect unique subtags after the baseTag
const subTagsSet = new Set();

for (const p of relatedPages) {
  for (const t of p.tags) {
    if (t.startsWith(baseTag + "/")) {
      const subtag = t.slice(baseTag.length + 1);
      subTagsSet.add(subtag);
    }
  }
}

const subTags = Array.from(subTagsSet).sort();

dv.header(1, `Sub-tags of [[index-${baseTag}.md|${baseTag}]]`);

if (subTags.length === 0) {
  dv.paragraph("No sub-tags found.");
  return;
} 

for (const st of subTags) {
	const fileName = `index-${baseTag}-${st}.md`;
	dv.paragraph(`- [[${fileName}|${st}]]`);
}

```
^code
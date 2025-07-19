---
title: Default Index Snippet
tags:
  - assets
---

```dataviewjs
await null;
const activeFile = app.workspace.getActiveFile();
if (!activeFile) {
	dv.paragraph("❌ Error: Could not get active file.");
	return;
}

const page = dv.page(activeFile.path);
if (!page || !page.tags) {
	dv.paragraph("⚠️ Error: No tags found in this file.");
	return;
}

const targetTag = page.tags[0]; 

const related = dv.pages(`#${targetTag}`)
	.where(p => p.file.path !== activeFile.path)
	.sort(p => p.file.name);

const targetTagIndex = "index-" + targetTag.replaceAll("/", "-") + ".md"
dv.header(1, `Index of [[${targetTagIndex}|${targetTag}]]`);

if (related.length === 0) {
	dv.paragraph("No related notes found.");
	return;
} 

for (let file of related) {
	dv.paragraph(`- ${file.file.link}`);
}
```
^code
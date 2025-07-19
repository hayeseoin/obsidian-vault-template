---
title: "Index Tempalte"
---
# Index Template
```dataviewjs
// Get the current active file — the file where this snippet is embedded
const activeFile = app.workspace.getActiveFile();
if (!activeFile) {
	dv.paragraph("❌ Error: Could not get active file.");
	return;
}

const page = dv.page(activeFile.path);
if (!page || !page.catalog_source) {
	dv.paragraph("⚠️ Error: `catalog_source` not found in embedding file's frontmatter.");
	return;
}
```
^code
---
title: Top Level Index
---
# Top Index
## projects

```dataviewjs
// Get all pages in the vault
const allPages = dv.pages();

// Set to hold unique top-level tags
const topLevelTags = new Set();

// Iterate through all pages and their tags
for (let page of allPages) {
  if (!page.tags) continue;

  for (let tag of page.tags) {
    // Get top-level tag before any slash
    const topTag = tag.split("/")[0];
    topLevelTags.add(topTag);
  }
}

// Convert set to sorted array
const sortedTags = Array.from(topLevelTags).sort();

// Output as list
dv.header(2, "Top-level tags");
if (sortedTags.length === 0) {
  dv.paragraph("No tags found.");
} else {
  for (let tag of sortedTags) {
	const fileName = `index-${tag}.md`
    dv.paragraph(`- [[${fileName}|${tag}]]`);
  }
}

```
^code

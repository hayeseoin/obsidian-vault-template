
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

const catalogSource = page.catalog_source;

// If it's a tag (starts with #), use tag-based filtering; otherwise, treat it as a path
const files = catalogSource.startsWith("#")
	? dv.pages(catalogSource).values
	: dv.pages().where(p => p.file.path.startsWith(catalogSource)).values;

if (files.length === 0) {
	dv.paragraph("No entries found for catalog_source: " + catalogSource);
	return;
}

for (let file of files) {
  const content = await dv.io.load(file.file.path)
  
  const commandMatch = content.match(/## Command\s*\n```sh\n(.*?)\n```/s)
  const command = commandMatch ? commandMatch[1].trim() : "No command"
  
  const descMatch = content.match(/## Description\s*\n(.*?)(?=\n##|$)/s)
  const description = descMatch ? descMatch[1].trim() : "No description"

  dv.paragraph(`**${file.file.link}**`)
  dv.paragraph(`<pre><code>${command}</code></pre>`)
  dv.paragraph(`${description}`)
  dv.paragraph("")
  dv.paragraph("---")
  dv.paragraph("")

}
```
^code

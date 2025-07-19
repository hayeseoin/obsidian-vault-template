---
created: 2025-07-19 21:15
tags: []
---
# Obsidian Vault Template

This is the basic template for an obsidian vault.

## Requires

NodeJS

## Overview

### Template

The notes are created with the following frontmatter to start. Fill in the tags to categorize the notes. 

```
---
created: 2025-07-19 21:15
tags:
  - README
---
```


### Tags

Files should be added to a flat file structure, and the organisation is handled by nested tags. These will be automatically indexed.

Example:

```
projects/hello-world
resources/bash
resources/sql
```
### Indexing
The scripts in `assets/scripts` process the nested tags are processed into a main `index.md` file in the root folder, and a collection of tag specific index files in `indexes/`. These are formatted like `index-{base-tag}-{child-tag}.md`. 

Examples:
```
projects/hello-world -> indexes/index-projects-hello-world.md
resources/python/python-puzzles -> indexes/index-resources-python-python-puzzles.md
```

These indexes all backlink through each other all the way up to the homepage.

The main index file is a special case. It shows Projects and Resources at the top of the page, followed by other tags, favourites, then an archive. 

### Backlinks

The scripts in `assets/scripts` automatically add backlinks to the top of every markdown file to it's parent index files (there will be multiple links if it is in multiple tags).

### Obsidian Shell Script

The shell scripts are run by the Obsidian Shell Script community plugin on every file creation, deletion and edit. Since the scripts themselves edit the files, a debounce cooldown of 1 second is set to prevent an infinite loop occurring. 
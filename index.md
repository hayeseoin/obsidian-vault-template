# Main Index


---
## 🧦 Uncategorized

 - [[README.md|README]]

---
## 🕐 Recently Edited

```dataviewjs
dv.list(
            dv.pages()
              .where(p => !p.file.name.startsWith('index'))
              .sort(p => p.file.mtime, 'desc')
              .limit(5)
              .map(p => p.file.link)
        );
```



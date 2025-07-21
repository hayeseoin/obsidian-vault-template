const fs = require('fs');
const path = require('path');

const NOTES_DIR = '../../..'; // Adjust this to your notes directory

fs.readdirSync(NOTES_DIR).forEach((file) => {
    const filePath = path.join(NOTES_DIR, file);

    if (fs.statSync(filePath).isFile() && file.endsWith('.md')) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Match ###### Index + dataviewjs block
        const updatedContent = content.replace(
            /###### Index\s*```dataviewjs[\s\S]*?```[\r\n]*/g,
            ''
        );

        if (updatedContent !== content) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✅ Cleaned: ${file}`);
        } else {
            console.log(`ℹ️ No change: ${file}`);
        }
    }
});

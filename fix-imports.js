const fs = require('fs');
const path = require('path');

const corrections = [
    {
        dir: 'client/src/components/manager/builder',
        pattern: "from '../../context/LanguageContext'",
        replacement: "from '../../../context/LanguageContext'",
        recursive: false // Only files directly in this dir
    },
    {
        dir: 'client/src/components/manager/catalog',
        pattern: "from '../../context/LanguageContext'",
        replacement: "from '../../../context/LanguageContext'",
        recursive: false
    },
    {
        dir: 'client/src/components/manager/builder/editors',
        pattern: "from '../../context/LanguageContext'",
        replacement: "from '../../../../context/LanguageContext'",
        recursive: false
    }
];

function processDir(dirConfig) {
    const fullDir = path.join(__dirname, dirConfig.dir);
    if (!fs.existsSync(fullDir)) {
        console.log(`Directory not found: ${fullDir}`);
        return;
    }

    const files = fs.readdirSync(fullDir);

    for (const file of files) {
        const filePath = path.join(fullDir, file);
        if (fs.statSync(filePath).isDirectory()) continue;

        if (file.endsWith('.jsx') || file.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(dirConfig.pattern)) {
                console.log(`Fixing ${filePath}`);
                content = content.replace(dirConfig.pattern, dirConfig.replacement);
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    }
}

corrections.forEach(processDir);
console.log('Import path fix completed.');

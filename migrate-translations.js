const fs = require('fs');
const path = require('path');

// Target files and directories for Checkpoint 3 (Teacher Portal)
const targets = [
    'c:/Users/Moha/Documents/GitHub/Linking-Directies-wajibet/MadrassaPlay/client/src/pages/TeacherDashboard.jsx',
    'c:/Users/Moha/Documents/GitHub/Linking-Directies-wajibet/MadrassaPlay/client/src/components/teacher'
];

let totalChanges = 0;
let filesChanged = 0;

function processFile(filePath) {
    try {
        let code = fs.readFileSync(filePath, 'utf8');
        const original = code;
        let changes = 0;

        // Safe regex: Convert t('key-name') to t.keyName
        // Negative lookbehind (?<![a-zA-Z_.]) ensures we don't match alert('...') or axios.get('...')
        // We look for t('...') where '...' contains only lowercase letters, numbers, and hyphens
        code = code.replace(/(?<![a-zA-Z_.])t\('([a-z][a-z0-9]*(?:-[a-z0-9]+)*)'\)/g, (match, key) => {
            changes++;
            // Convert kebab-case to camelCase
            const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            return `t.${camelKey}`;
        });

        if (code !== original) {
            fs.writeFileSync(filePath, code, 'utf8');
            console.log(`Modified: ${path.basename(filePath)} (${changes} replacements)`);
            totalChanges += changes;
            filesChanged++;
        }
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err.message);
    }
}

function walk(target) {
    if (!fs.existsSync(target)) {
        console.warn(`Target not found: ${target}`);
        return;
    }

    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
        const files = fs.readdirSync(target);
        files.forEach(file => walk(path.join(target, file)));
    } else if (target.endsWith('.jsx') || target.endsWith('.js')) {
        processFile(target);
    }
}

console.log('Starting migration for Teacher Portal...');
targets.forEach(target => walk(target));
console.log('Migration complete.');
console.log(`Files changed: ${filesChanged}`);
console.log(`Total replacements: ${totalChanges}`);

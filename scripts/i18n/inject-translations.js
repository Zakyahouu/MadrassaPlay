const fs = require('fs');
const path = require('path');

// Target directories/files for Checkpoint 3 (Teacher Portal)
const targets = [
    'c:/Users/Moha/Documents/GitHub/Linking-Directies-wajibet/MadrassaPlay/client/src/pages/TeacherDashboard.jsx',
    'c:/Users/Moha/Documents/GitHub/Linking-Directies-wajibet/MadrassaPlay/client/src/components/teacher'
];

// Context-aware replacements for Teacher Portal
const replacements = [
    // Dashboard Stats
    [/(?<=>)Total Games(?=<)/g, '{t.totalGames}'],
    [/(?<=>)Active Students(?=<)/g, '{t.activeStudents}'],
    [/(?<=>)Average Score(?=<)/g, '{t.averageScore}'],
    [/(?<=>)Live Sessions(?=<)/g, '{t.liveSessions}'],

    // Section Headers
    [/(?<=>)Quick Actions(?=<)/g, '{t.quickActions}'],
    [/(?<=>)Recent Activity(?=<)/g, '{t.recentActivity}'],
    [/(?<=>)Welcome back, Teacher!(?=<)/g, '{t.welcomeBack}'],
    [/(?<=>)Ready to create amazing learning experiences today\?(?=<)/g, '{t.readyToContinue}'],

    // Action Buttons
    [/(?<=>)Create New Game(?=<)/g, '{t.createGame}'],
    [/(?<=>)Host Live Session(?=<)/g, '{t.liveSessions}'],
    [/(?<=>)View Results(?=<)/g, '{t.viewResults}'],
    [/(?<=>)Schedule Assignment(?=<)/g, '{t.createAssignment}'],

    // Table Headers
    [/(?<=>)Name(?=<)/g, '{t.fullName || "Name"}'],
    [/(?<=>)Student(?=<)/g, '{t.student}'],
    [/(?<=>)Class(?=<)/g, '{t.class}'],
    [/(?<=>)Status(?=<)/g, '{t.status}'],
    [/(?<=>)Actions(?=<)/g, '{t.actions}'],
    [/(?<=>)Email(?=<)/g, '{t.email}'],
    [/(?<=>)Role(?=<)/g, '{t.role}'],

    // Fallback French replacements (just in case)
    [/(?<=>)Chargement\.\.\.(?=<)/g, '{t.loading}'],
    [/"Chargement\.\.\."/g, '{t.loading}'],
];

let totalChanges = 0;
let filesChanged = 0;

function processFile(filePath) {
    try {
        let code = fs.readFileSync(filePath, 'utf8');
        const original = code;
        let changes = 0;

        // 1. Add useLanguage if we have matches for replacements
        let shouldAddContext = false;
        replacements.forEach(([regex, replacement]) => {
            if (regex.test(code)) shouldAddContext = true;
        });

        if (shouldAddContext) {
            // Add imports if missing
            if (!code.includes('useLanguage')) {
                const importRegex = /^import .+$/gm;
                let lastImportMatch;
                let match;
                while ((match = importRegex.exec(code)) !== null) {
                    lastImportMatch = match;
                }

                // Determine relative path to LanguageContext
                let contextPath = path.relative(path.dirname(filePath),
                    'c:/Users/Moha/Documents/GitHub/Linking-Directies-wajibet/MadrassaPlay/client/src/context/LanguageContext'
                ).replace(/\\/g, '/');
                if (!contextPath.startsWith('.')) contextPath = './' + contextPath;

                if (lastImportMatch) {
                    const insertPos = lastImportMatch.index + lastImportMatch[0].length;
                    const importLine = `\nimport { useLanguage } from '${contextPath}';`;
                    code = code.slice(0, insertPos) + importLine + code.slice(insertPos);
                }
            }

            // Add hook call if missing
            if (!code.includes('const { t') && !code.includes('useLanguage()')) {
                const componentRegex = /(?:const|function)\s+\w+\s*=?\s*\(?\s*(?:\{[^}]*\}|[^)]*)\)?\s*=>\s*\{/;
                const compMatch = componentRegex.exec(code);
                if (compMatch) {
                    const insertPos = compMatch.index + compMatch[0].length;
                    code = code.slice(0, insertPos) + '\n  const { t } = useLanguage();' + code.slice(insertPos);
                }
            }
        }

        // 2. Apply replacements
        replacements.forEach(([regex, replacement]) => {
            const before = code;
            code = code.replace(regex, replacement);
            if (code !== before) changes++;
        });

        if (code !== original) {
            filesChanged++;
            totalChanges += changes;
            fs.writeFileSync(filePath, code, 'utf8');
            console.log(`Modified: ${path.basename(filePath)} (${changes} replacements)`);
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

console.log('Starting injection for Teacher Portal...');
targets.forEach(target => walk(target));
console.log('Injection complete.');
console.log(`Files changed: ${filesChanged}`);
console.log(`Total replacements: ${totalChanges}`);

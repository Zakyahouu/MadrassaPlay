const fs = require('fs');
const path = require('path');

// Common translations map (English -> Key)
// These should match keys in translations.js
const commonReplacements = {
    // Admin specific
    "System Health": "t.systemHealth",
    "Total Schools": "t.totalSchools",
    "Total Users": "t.totalUsers",
    "User Management": "t.userManagement",
    "School Management": "t.schoolManagement",
    "Platform Overview": "t.platformOverview",
    "Total Games": "t.totalGames",
    "System Status": "t.systemStatus",
    "Recent Registrations": "t.recentRegistrations",
    "Test Games": "t.testGames",
    "Template Games": "t.templateGames",
    "Game Template Manager": "t.gameTemplateManager",
    "Badge Manager": "t.badgeManager",
    "Analytics": "t.analytics",
    "3D Model Management": "t.model3dManagement",
    "School Documents": "t.schoolDocuments",
    "School Creation Wizard": "t.schoolCreationWizard",
    "Credentials": "t.credentials",

    // School Status
    "Active": "t.active",
    "Trial": "t.trial",
    "Inactive": "t.inactive",
    "Suspended": "t.suspended",

    // Common Actions
    "Create School": "t.createSchool",
    "Add School": "t.addSchool",
    "Edit School": "t.editSchool",
    "Delete School": "t.deleteSchool",
    "View Details": "t.viewDetails",
    "Save Changes": "t.saveChanges",
    "Cancel": "t.cancel",
    "Delete": "t.delete",
    "Edit": "t.edit",
    "Action": "t.action",
    "Actions": "t.actions",
    "Search...": "t.searchPlaceholder",
    "Search schools...": "t.searchSchools",

    // Shared / Layout
    "Dashboard": "t.dashboard",
    "Profile": "t.profile",
    "Settings": "t.settings",
    "Logout": "t.logout",
    "Notifications": "t.notifications",
    "Loading...": "t.loading",
    "No data": "t.noData",
    "No schools found": "t.noSchoolsFound",

    // Errors/Success
    "Success": "t.success",
    "Error": "t.error",
    "School created successfully": "t.schoolCreatedSuccessfully",
    "Failed to create school": "t.failedCreateSchool",
};

const directories = [
    {
        path: 'client/src/components/admin',
        depth: 2,
        importPath: '../../'
    },
    {
        path: 'client/src/components/admin/manager',
        depth: 3,
        importPath: '../../../'
    },
    {
        path: 'client/src/components/shared',
        depth: 2,
        importPath: '../../'
    },
    {
        path: 'client/src/components/layout',
        depth: 2,
        importPath: '../../'
    },
    {
        path: 'client/src/pages',
        depth: 1,
        importPath: '../',
        files: ['AdminDashboard.jsx']
    }
];

function processFile(filePath, config) {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Inject useLanguage hook
    if (!content.includes('useLanguage')) {
        // Add import
        if (!content.includes(`import { useLanguage }`)) {
            const importStmt = `import { useLanguage } from '${config.importPath}context/LanguageContext';\n`;
            // Insert after last import or at top
            const lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLine = content.indexOf('\n', lastImportIndex);
                content = content.slice(0, endOfLine + 1) + importStmt + content.slice(endOfLine + 1);
            } else {
                content = importStmt + content;
            }
        }

        // Add hook call
        // Look for component definition: const Component = ... or function Component...
        const componentRegex = /(const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*{|function\s+\w+\s*\([^)]*\)\s*{)/;
        const match = content.match(componentRegex);
        if (match) {
            const insertionPoint = match.index + match[0].length;
            content = content.slice(0, insertionPoint) + '\n  const { t } = useLanguage();' + content.slice(insertionPoint);
        }
    }

    // 2. Text Replacements
    // sort keys by length descending to avoid partial matches
    const sortedKeys = Object.keys(commonReplacements).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
        const value = commonReplacements[key];
        // Replace >Text< with >{t.key}<
        content = content.split(`>${key}<`).join(`>{${value}}<`);

        // Replace "Text" with {t.key} in props ?? Riskier, let's stick to Safe strings
        // Example: title="Text" -> title={t.key}
        content = content.split(`="${key}"`).join(`={${value}}`);
        content = content.split(`='${key}'`).join(`={${value}}`);

        // Replace placeholder="Text"
        content = content.split(`placeholder="${key}"`).join(`placeholder={${value}}`);
    }

    if (content !== originalContent) {
        console.log(`Migrating: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

directories.forEach(dirConfig => {
    const fullDir = path.join(__dirname, dirConfig.path);

    if (dirConfig.files) {
        // Process specific files
        dirConfig.files.forEach(file => {
            processFile(path.join(fullDir, file), dirConfig);
        });
    } else {
        // Process all jsx files in directory (shallow)
        if (fs.existsSync(fullDir)) {
            const files = fs.readdirSync(fullDir);
            for (const file of files) {
                if ((file.endsWith('.jsx') || file.endsWith('.js')) && !fs.statSync(path.join(fullDir, file)).isDirectory()) {
                    processFile(path.join(fullDir, file), dirConfig);
                }
            }
        } else {
            console.log(`Dir not found: ${fullDir}`);
        }
    }
});

console.log('Migration script for Admin & Shared completed.');

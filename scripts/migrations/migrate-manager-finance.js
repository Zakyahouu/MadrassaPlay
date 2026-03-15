const fs = require('fs');
const path = require('path');

// Mappings for common UI strings in Manager/Finance portal
const STRING_MAPPINGS = {
    // Navigation & Headers
    'Manager Dashboard': 'managerDashboard',
    'Overview': 'overview',
    'Classes': 'classes',
    'Students': 'students',
    'Teachers': 'teachers',
    'Employees': 'employees',
    'Finance': 'finance',
    'Reports': 'reports',
    'Settings': 'settings',
    'Timetable': 'timetable',
    'Attendance': 'attendance',
    'Rooms': 'rooms',
    'Equipment': 'equipment',
    'Catalog': 'catalog',
    'Announcements': 'announcements',
    'Profile': 'profile',
    'Logout': 'logout',

    // Actions
    'Add': 'add',
    'Edit': 'edit',
    'Delete': 'delete',
    'View': 'view',
    'Save': 'save',
    'Cancel': 'cancel',
    'Update': 'update',
    'Create': 'create',
    'Search': 'search',
    'Filter': 'filter',
    'Export': 'export',
    'Import': 'import',
    'Download': 'download',
    'Print': 'print',
    'Refresh': 'refresh',
    'Loading': 'loading',
    'Processing': 'processing',
    'Submit': 'submit',
    'Close': 'close',
    'Back': 'back',
    'Next': 'next',
    'Previous': 'previous',
    'Confirm': 'confirm',

    // Common Table Headers
    'Name': 'name',
    'Email': 'email',
    'Role': 'role',
    'Status': 'status',
    'Date': 'date',
    'Action': 'action',
    'Actions': 'actions',
    'Type': 'type',
    'Amount': 'amount',
    'Description': 'description',
    'Category': 'category',
    'Price': 'price',
    'Quantity': 'quantity',
    'Total': 'total',
    'Balance': 'balance',
    'Created At': 'createdAt',
    'Updated At': 'updatedAt',
    'ID': 'id',
    'Phone': 'phone',
    'Address': 'address',

    // Finance Specific
    'Income': 'income',
    'Expenses': 'expenses',
    'Net Balance': 'netBalance',
    'Transaction': 'transaction',
    'Transactions': 'transactions',
    'Payment': 'payment',
    'Payments': 'payments',
    'Salary': 'salary',
    'Salaries': 'salaries',
    'Month': 'month',
    'Year': 'year',
    'Paid': 'paid',
    'Pending': 'pending',
    'Overdue': 'overdue',
    'Invoice': 'invoice',
    'Receipt': 'receipt',
    'Bank': 'bank',
    'Cash': 'cash',
    'Method': 'method',

    // Messages
    'Are you sure?': 'areYouSure',
    'No data found': 'noDataFound',
    'Success': 'success',
    'Error': 'error',
    'Warning': 'warning',
    'Saved successfully': 'savedSuccessfully',
    'Deleted successfully': 'deletedSuccessfully',
    'Something went wrong': 'somethingWentWrong',
};

// Target directories
const TARGET_DIRS = [
    path.join(__dirname, 'client/src/components/manager'),
    path.join(__dirname, 'client/src/components/finance'),
    // path.join(__dirname, 'client/src/pages') // Be careful with pages, might need manual check
];

// Helper to escape regex special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process a file
function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let hasChanges = false;

    // 1. Inject hook if missing
    if (!content.includes('useLanguage') && (content.includes('React') || content.includes('import'))) {
        // Check if it's a functional component (rough heuristic)
        if (content.match(/const\s+\w+\s*=\s*(\([^)]*\)|props)\s*=>/) || content.match(/function\s+\w+\s*\(/)) {

            // Add import
            if (!content.includes("import { useLanguage }")) {
                const importStatement = "import { useLanguage } from '../../context/LanguageContext';\n";
                // Insert after last import or at top
                const lastImport = content.lastIndexOf('import ');
                if (lastImport !== -1) {
                    const endOfImport = content.indexOf('\n', lastImport);
                    content = content.slice(0, endOfImport + 1) + importStatement + content.slice(endOfImport + 1);
                } else {
                    content = importStatement + content;
                }
                hasChanges = true;
            }

            // Add hook usage
            // Find the start of the component function body
            const componentRegex = /(const\s+\w+\s*=\s*(\([^)]*\)|props)\s*=>\s*{|function\s+\w+\s*\([^)]*\)\s*{)/g;
            let match;
            while ((match = componentRegex.exec(content)) !== null) {
                const index = match.index + match[0].length;
                // Check if hook is already there
                const bodyStart = content.slice(index, index + 200);
                if (!bodyStart.includes('const { t } = useLanguage()')) {
                    content = content.slice(0, index) + "\n  const { t } = useLanguage();" + content.slice(index);
                    hasChanges = true;
                }
            }
        }
    }

    // 2. Replace hardcoded strings
    for (const [text, key] of Object.entries(STRING_MAPPINGS)) {
        // JSX Text: <div>Overview</div> -> <div>{t.overview}</div>
        // Careful not to replace substrings in variable names or attributes incorrectly
        const jsxRegex = new RegExp(`>\\s*${escapeRegExp(text)}\\s*<`, 'g');
        if (content.match(jsxRegex)) {
            content = content.replace(jsxRegex, `>{t.${key}}<`);
            hasChanges = true;
        }

        // Alt attributes: alt="Overview" -> alt={t.overview}
        const altRegex = new RegExp(`alt=["']${escapeRegExp(text)}["']`, 'g');
        if (content.match(altRegex)) {
            content = content.replace(altRegex, `alt={t.${key}}`);
            hasChanges = true;
        }

        // Placeholder attributes: placeholder="Search" -> placeholder={t.search}
        const placeholderRegex = new RegExp(`placeholder=["']${escapeRegExp(text)}["']`, 'g');
        if (content.match(placeholderRegex)) {
            content = content.replace(placeholderRegex, `placeholder={t.${key}}`);
            hasChanges = true;
        }

        // Title attributes: title="Edit" -> title={t.edit}
        const titleRegex = new RegExp(`title=["']${escapeRegExp(text)}["']`, 'g');
        if (content.match(titleRegex)) {
            content = content.replace(titleRegex, `title={t.${key}}`);
            hasChanges = true;
        }
    }

    if (hasChanges) {
        console.log(`Modified: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

// Walk directories
function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            processFile(filePath);
        }
    }
}

// Run
TARGET_DIRS.forEach(dir => {
    console.log(`Scanning ${dir}...`);
    walk(dir);
});

console.log('Migration script completed.');

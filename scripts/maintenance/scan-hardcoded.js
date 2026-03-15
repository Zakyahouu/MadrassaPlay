const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/Moha/Documents/GitHub/Linking-Directies-wajibet/MadrassaPlay/client/src';

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkSync(fullPath, filelist);
        } else if (fullPath.endsWith('.jsx')) {
            filelist.push(fullPath);
        }
    });
    return filelist;
}

const files = walkSync(srcDir);

// Find JSX files with hardcoded French text that DON'T use useLanguage
const frenchPatterns = [
    'Chargement', 'Aucun', 'Ajouter', 'Modifier', 'Supprimer', 'Rechercher',
    'Sélectionner', 'Créer', 'Enregistrer', 'Annuler', 'Erreur', 'Succès',
    'Total', 'Détails', 'Fermer', 'Confirmer', 'Présence', 'Classe',
    'Étudiant', 'Enseignant', 'Employé', 'Salle', 'Équipement', 'Rapport'
];

const results = [];

files.forEach(filePath => {
    const code = fs.readFileSync(filePath, 'utf8');
    const hasUseLanguage = code.includes('useLanguage');
    const rel = path.relative(srcDir, filePath).replace(/\\/g, '/');

    // Count hardcoded French strings in JSX (between > and < or in attributes)
    let frenchCount = 0;
    frenchPatterns.forEach(pattern => {
        const regex = new RegExp('>' + pattern + '|"' + pattern + '|' + pattern + '"', 'g');
        const matches = code.match(regex);
        if (matches) frenchCount += matches.length;
    });

    if (frenchCount > 0 && !hasUseLanguage) {
        results.push({ file: rel, count: frenchCount, size: code.length });
    }
});

results.sort((a, b) => b.count - a.count);
console.log('Files with hardcoded French text but NO useLanguage import:');
console.log('Total: ' + results.length);
results.forEach(r => {
    console.log(`  ${r.file} (${r.count} French strings, ${Math.round(r.size / 1024)}KB)`);
});

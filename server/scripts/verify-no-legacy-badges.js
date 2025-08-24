#!/usr/bin/env node
// Guard script: ensure legacy global badge system files are not reintroduced.
// If any of the legacy filenames are detected, exit with non-zero status.
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const legacyPaths = [
  'controllers/badgeController.js',
  'models/Badge.js',
  'models/EarnedBadge.js',
  'routes/badgeRoutes.js'
];

let found = [];
for (const rel of legacyPaths) {
  const full = path.join(repoRoot, rel);
  if (fs.existsSync(full)) {
    found.push(rel);
  }
}

if (found.length) {
  console.error('\n\x1b[31mError: Legacy badge system files detected:\x1b[0m');
  for (const f of found) console.error(' - ' + f);
  console.error('\nAttempting auto-removal...');
  for (const rel of found) {
    try { fs.unlinkSync(path.join(repoRoot, rel)); console.error('Removed ' + rel); } catch (e) { console.error('Failed to remove ' + rel + ': ' + e.message); }
  }
  console.error('Rerun your command.');
  process.exit(1);
} else {
  console.log('Legacy badge system verification passed.');
}

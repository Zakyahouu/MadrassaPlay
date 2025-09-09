// server/scripts/autoBackup.js
// Lightweight JSON snapshot of key collections, gated by BACKUP_ON_START=true
const fs = require('fs').promises;
const path = require('path');

async function autoBackup() {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    // Lazy-require models to avoid circular deps during import
    const User = require('../models/User');
    const School = require('../models/School');
    const Class = require('../models/Class');
    const Assignment = require('../models/Assignment');
    const GameCreation = require('../models/GameCreation');
    const GameResult = require('../models/GameResult');

    const [users, schools, classes, assignments, creations, results] = await Promise.all([
      User.find({}).lean(),
      School.find({}).lean(),
      Class.find({}).lean(),
      Assignment.find({}).lean(),
      GameCreation.find({}).lean(),
      GameResult.find({}).lean(),
    ]);

    const payload = {
      meta: { createdAt: new Date(), note: 'Auto-backup at server start' },
      users,
      schools,
      classes,
      assignments,
      creations,
      results,
    };

    const file = path.join(backupDir, `snapshot-${stamp}.json`);
    await fs.writeFile(file, JSON.stringify(payload, null, 2));
    console.log(`[backup] Wrote startup snapshot to ${file}`);
  } catch (err) {
    console.warn('[backup] Startup snapshot failed:', err.message);
  }
}

module.exports = autoBackup;

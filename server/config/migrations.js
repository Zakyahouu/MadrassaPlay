// server/config/migrations.js
const mongoose = require('mongoose');

async function ensureUserStudentCodePartialIndex() {
  try {
    const col = mongoose.connection.collection('users');
    const indexes = await col.indexes();
    const name = 'school_1_studentCode_1';
    const existing = indexes.find((i) => i.name === name);

    // If index exists but isn't partial for students, drop it
    if (existing && !(existing.partialFilterExpression && existing.partialFilterExpression.role === 'student')) {
      try {
        await col.dropIndex(name);
        console.log(`[migrations] Dropped legacy index ${name}`);
      } catch (e) {
        console.warn(`[migrations] Failed to drop index ${name}:`, e.message);
      }
    }

    // Ensure the correct partial unique index exists
    try {
      await col.createIndex(
        { school: 1, studentCode: 1 },
        { unique: true, partialFilterExpression: { role: 'student', studentCode: { $type: 'string' } } }
      );
      console.log('[migrations] Ensured partial unique index on {school, studentCode} for students');
    } catch (e) {
      if (!/already exists/i.test(e.message)) {
        console.warn('[migrations] createIndex warning:', e.message);
      }
    }
  } catch (err) {
    console.warn('[migrations] ensureUserStudentCodePartialIndex skipped:', err.message);
  }
}

module.exports = { ensureUserStudentCodePartialIndex };

// --- NEW: Ensure Attendance indexes are correct and drop legacy ones ---
async function ensureAttendanceIndexes() {
  try {
    const col = mongoose.connection.collection('attendances');
    const indexes = await col.indexes();

    // Drop legacy unique index on (session, student) if present
    const legacyIdx = indexes.find((i) => i.name === 'session_1_student_1');
    if (legacyIdx) {
      try {
        await col.dropIndex('session_1_student_1');
        console.log('[migrations] Dropped legacy attendance index session_1_student_1');
      } catch (e) {
        console.warn('[migrations] Failed to drop legacy attendance index session_1_student_1:', e.message);
      }
    }

    // Ensure the correct unique index exists on (enrollmentId, date)
    const desiredName = 'enrollmentId_1_date_1';
    const desired = indexes.find((i) => i.name === desiredName);
    if (!desired) {
      try {
        await col.createIndex({ enrollmentId: 1, date: 1 }, { unique: true, name: desiredName });
        console.log('[migrations] Ensured unique index on attendances { enrollmentId: 1, date: 1 }');
      } catch (e) {
        if (!/already exists/i.test(e.message)) {
          console.warn('[migrations] createIndex (attendance enrollmentId/date) warning:', e.message);
        }
      }
    }

    // Helpful secondary indexes (best-effort)
    try {
      await col.createIndex({ schoolId: 1, classId: 1, date: 1 }, { name: 'school_class_date' });
    } catch {}
    try {
      await col.createIndex({ schoolId: 1, studentId: 1, date: -1 }, { name: 'school_student_date' });
    } catch {}
  } catch (err) {
    console.warn('[migrations] ensureAttendanceIndexes skipped:', err.message);
  }
}

module.exports.ensureAttendanceIndexes = ensureAttendanceIndexes;

// Ensure partial unique index for payments idempotency (idempotencyKey present only)
async function ensurePaymentsIdempotencyIndex() {
  try {
    const col = mongoose.connection.collection('payments');
    const indexes = await col.indexes();
    const desiredName = 'enrollmentId_1_idempotencyKey_1';
    const existing = indexes.find((i) => i.name === desiredName);
    // If existing index is not partial on idempotencyKey string type, drop it first
    if (existing && !(existing.partialFilterExpression && existing.partialFilterExpression.idempotencyKey && existing.partialFilterExpression.idempotencyKey.$type === 'string')) {
      try {
        await col.dropIndex(desiredName);
        console.log('[migrations] Dropped legacy payments idempotency index');
      } catch (e) {
        console.warn('[migrations] Failed to drop legacy payments idempotency index:', e.message);
      }
    }
    // Ensure correct partial unique index exists
    try {
      await col.createIndex(
        { enrollmentId: 1, idempotencyKey: 1 },
        { unique: true, name: desiredName, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
      );
      console.log('[migrations] Ensured partial unique index on payments { enrollmentId, idempotencyKey }');
    } catch (e) {
      if (!/already exists/i.test(e.message)) {
        console.warn('[migrations] createIndex (payments idempotency) warning:', e.message);
      }
    }
  } catch (err) {
    console.warn('[migrations] ensurePaymentsIdempotencyIndex skipped:', err.message);
  }
}

module.exports.ensurePaymentsIdempotencyIndex = ensurePaymentsIdempotencyIndex;
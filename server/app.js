const express = require('express');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');

const { ensureUserStudentCodePartialIndex, ensureAttendanceIndexes, ensurePaymentsIdempotencyIndex } = require('./config/migrations');

// Load optional services guarded by env flags
const enableDeletionCron = process.env.ENABLE_SCHOOL_DELETION_CRON === 'true';
if (enableDeletionCron) {
  // Lazy-require to avoid any side effects when disabled
  try { require('./services/schoolDeletionService'); } catch (e) { /* ignore */ }
}


// Avoid auto-connecting when running under Jest (tests manage their own DB)
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  connectDB().then(async () => {
    await ensureUserStudentCodePartialIndex();
    await ensureAttendanceIndexes();
    if (process.env.BACKUP_ON_START === 'true') {
      try { await require('./scripts/autoBackup')(); } catch (e) { /* ignore */ }
    }
    await ensurePaymentsIdempotencyIndex();
  });
}

const app = express();
app.use(express.json());

// Attach realtime state to requests so controllers can check live access
const { liveGames } = require('./realtimeState');
app.use((req, res, next) => {
  // io is set in server.js; we pick it up lazily to avoid circular requires
  try { req.io = require('./realtimeState').io || null; } catch { req.io = null; }
  req.liveGames = liveGames;
  next();
});

app.use('/engines', express.static(path.join(__dirname, 'public', 'engines')));
// Serve uploaded media (icons/content assets)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// Serve badge icons
app.use('/badge-icons', express.static(path.join(__dirname, 'public', 'badge-icons')));
// Serve school documents
app.use('/school-documents', express.static(path.join(__dirname, 'public', 'school-documents')));

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/schools', require('./routes/schoolRoutes'));
app.use('/api/school-documents', require('./routes/schoolDocumentRoutes'));
app.use('/api/catalog', require('./routes/catalogRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/templates', require('./routes/gameTemplateRoutes'));
app.use('/api/creations', require('./routes/gameCreationRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/results', require('./routes/gameResultRoutes'));
app.use('/api/template-badges', require('./routes/templateBadgeRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/reporting', require('./routes/reportingRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
// Important: mount resource routes before generic class routes to avoid guard conflicts
app.use('/api/classes', require('./routes/classResourceRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/advertisements', require('./routes/advertisementRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/live-sessions', require('./routes/liveSessionRoutes'));

// Centralized error handler: respect res.statusCode set by controllers; default to 500
// Ensures thrown errors with prior res.status(...) don't become generic 500s
app.use((err, req, res, next) => {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const message = err?.message || 'Server Error';
  // Avoid leaking stack in production
  const payload = process.env.NODE_ENV === 'production' ? { message } : { message, stack: err?.stack };
  res.status(status).json(payload);
});

module.exports = app;

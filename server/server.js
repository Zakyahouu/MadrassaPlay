// server/app.js
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const {
  ensureUserStudentCodePartialIndex,
  ensureAttendanceIndexes,
  ensurePaymentsIdempotencyIndex
} = require('./config/migrations');

// Optional services
if (process.env.ENABLE_SCHOOL_DELETION_CRON === 'true') {
  try { require('./services/schoolDeletionService'); } catch {}
}

// DB connection (skip in test)
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  connectDB().then(async () => {
    await ensureUserStudentCodePartialIndex();
    await ensureAttendanceIndexes();
    if (process.env.BACKUP_ON_START === 'true') {
      try { await require('./scripts/autoBackup')(); } catch {}
    }
    await ensurePaymentsIdempotencyIndex();
  });
}

const app = express();

// Parse JSON
app.use(express.json());

// Enable CORS (from .env)
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// Realtime state injection
const { liveGames } = require('./realtimeState');
app.use((req, res, next) => {
  try { req.io = require('./realtimeState').io || null; } catch { req.io = null; }
  req.liveGames = liveGames;
  next();
});

// Static resources
app.use('/engines', express.static(path.join(__dirname, 'public', 'engines')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/badge-icons', express.static(path.join(__dirname, 'public', 'badge-icons')));
app.use('/school-documents', express.static(path.join(__dirname, 'public', 'school-documents')));

// API routes
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

// Error handler
app.use((err, req, res, next) => {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const message = err?.message || 'Server Error';
  const payload = process.env.NODE_ENV === 'production'
    ? { message }
    : { message, stack: err?.stack };
  res.status(status).json(payload);
});

module.exports = app;

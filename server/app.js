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
app.set('trust proxy', 1);
app.use(express.json());

// Add CORS middleware
const cors = require('cors');

// Define allowed origins based on environment
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use CORS_ORIGIN or default to VPS IP
    return process.env.CORS_ORIGIN || 'http://72.60.133.119';
  } else {
    // Development: Allow localhost and VPS for testing
    return [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://0.0.0.0:5173',
      process.env.CORS_ORIGIN || 'http://72.60.133.119'
    ].filter(Boolean);
  }
};

const allowedOrigins = getAllowedOrigins();
console.log('🌐 CORS Configuration:');
console.log('  Allowed origins:', allowedOrigins);
console.log('  NODE_ENV:', process.env.NODE_ENV);

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Attach realtime state to requests so controllers can check live access
const { liveGames } = require('./realtimeState');
app.use((req, res, next) => {
  // io is set in server.js; we pick it up lazily to avoid circular requires
  try { req.io = require('./realtimeState').io || null; } catch { req.io = null; }
  req.liveGames = liveGames;
  next();
});

// Static file serving moved to server.js to ensure proper middleware order
// This prevents React Router from intercepting engine files in production

// Safe route loading with error handling to prevent path-to-regexp errors
try {
  const { loadAllRoutes } = require('./safe-route-loader');
  loadAllRoutes(app);
} catch (error) {
  console.error('❌ Critical error loading routes:', error);
  
  // Fallback: Load routes individually with try-catch
  const routeConfigs = [
    { path: '/api/users', file: './routes/userRoutes' },
    { path: '/api/schools', file: './routes/schoolRoutes' },
    { path: '/api/school-documents', file: './routes/schoolDocumentRoutes' },
    { path: '/api/catalog', file: './routes/catalogRoutes' },
    { path: '/api/teachers', file: './routes/teacherRoutes' },
    { path: '/api/students', file: './routes/studentRoutes' },
    { path: '/api/templates', file: './routes/gameTemplateRoutes' },
    { path: '/api/creations', file: './routes/gameCreationRoutes' },
    { path: '/api/assignments', file: './routes/assignmentRoutes' },
    { path: '/api/results', file: './routes/gameResultRoutes' },
    { path: '/api/template-badges', file: './routes/templateBadgeRoutes' },
    { path: '/api/leaderboard', file: './routes/leaderboardRoutes' },
    { path: '/api/reporting', file: './routes/reportingRoutes' },
    { path: '/api/staff', file: './routes/staffRoutes' },
    { path: '/api/employees', file: './routes/employeeRoutes' },
    // Important: mount resource routes before generic class routes to avoid guard conflicts
    { path: '/api/classes', file: './routes/classResourceRoutes' },
    { path: '/api/classes', file: './routes/classRoutes' },
    { path: '/api/enrollments', file: './routes/enrollmentRoutes' },
    { path: '/api/payments', file: './routes/paymentRoutes' },
    { path: '/api/attendance', file: './routes/attendanceRoutes' },
    { path: '/api/rooms', file: './routes/roomRoutes' },
    { path: '/api/equipment', file: './routes/equipmentRoutes' },
    { path: '/api/advertisements', file: './routes/advertisementRoutes' },
    { path: '/api/finance', file: './routes/financeRoutes' },
    { path: '/api/logs', file: './routes/logRoutes' },
    { path: '/api/live-sessions', file: './routes/liveSessionRoutes' }
  ];
  
  routeConfigs.forEach(({ path, file }) => {
    try {
      console.log(`🔄 Loading route: ${path}`);
      app.use(path, require(file));
      console.log(`✅ Successfully loaded: ${path}`);
    } catch (routeError) {
      console.error(`❌ Failed to load route ${path}:`, routeError.message);
      
      // Create a fallback route that returns an error
      app.use(path, (req, res) => {
        res.status(500).json({
          error: 'Route unavailable',
          message: `Route ${path} failed to load: ${routeError.message}`
        });
      });
    }
  });
}

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

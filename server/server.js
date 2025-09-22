// ✅ BREADCRUMB LOGS HAVE BEEN ADDED TO HELP DEBUG STARTUP
console.log('✅ [1/5] Server script starting up...');

// Load environment variables FIRST
require('dotenv').config();

// Debug environment variables
console.log('🔍 Environment check:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('  MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app'); // Import the configured Express app
const connectDB = require('./config/db');
const { setIO } = require('./realtimeState'); // We'll use this to share the IO instance

const {
  ensureUserStudentCodePartialIndex,
  ensureAttendanceIndexes,
  ensurePaymentsIdempotencyIndex
} = require('./config/migrations');

// Optional services
if (process.env.ENABLE_SCHOOL_DELETION_CRON === 'true') {
  try { require('./services/schoolDeletionService'); } catch (e) { console.error('Failed to load schoolDeletionService:', e); }
}

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// --- Configure Socket.IO ---
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    methods: ["GET", "POST"]
  }
});

// Share the 'io' instance with the rest of the application
setIO(io);
console.log('✅ [2/5] Socket.IO initialized and shared.');

// --- Main Socket.IO connection handler ---
// You would require your main socket handler file here, for example:
// require('./socket/socketHandler')(io);
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- Asynchronous Start Function ---
const startServer = async () => {
  try {
    // Connect to DB only if not in a test environment
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      console.log('✅ [3/5] Connecting to database...');
      await connectDB();
      console.log('Database connection successful.');

      // Run migrations and backups
      await ensureUserStudentCodePartialIndex();
      await ensureAttendanceIndexes();
      await ensurePaymentsIdempotencyIndex();
      if (process.env.BACKUP_ON_START === 'true') {
        try { await require('./scripts/autoBackup')(); } catch (e) { console.error('Auto-backup failed:', e); }
      }
    }

    console.log('✅ [4/5] About to start server on port', PORT);
    server.listen(PORT, () => {
      console.log(`🚀 [5/5] Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1); // Exit with failure code
  }
};

// --- Execute Start ---
startServer();

// --- Graceful Shutdown & Error Handling ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});
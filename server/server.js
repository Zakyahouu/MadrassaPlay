// ✅ BREADCRUMB LOGS HAVE BEEN ADDED TO HELP DEBUG STARTUP
console.log('✅ [1/5] Server script starting up...');

const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const express = require('express');
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
const getSocketIOOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use CORS_ORIGIN or default to VPS IP
    const corsOrigin = process.env.CORS_ORIGIN || 'http://72.60.133.119';
    return corsOrigin.split(',').map(o => o.trim()).filter(Boolean);
  } else {
    // Development: Allow localhost and VPS for testing
    const defaultOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://0.0.0.0:5173'
    ];
    const customOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
    return [...defaultOrigins, ...customOrigins];
  }
};

const allowedOrigins = getSocketIOOrigins();
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Share the 'io' instance with the rest of the application
setIO(io);
console.log('✅ [2/5] Socket.IO initialized and shared.');

// --- Main Socket.IO connection handler ---
const { liveGames } = require('./realtimeState');
const LiveSession = require('./models/LiveSession');
const LiveParticipant = require('./models/LiveParticipant');
const User = require('./models/User');
const Class = require('./models/Class');

// Single ranking rule: higher score, then faster time, then fewer mistakes, then earlier finish
function rankComparator(a, b) {
  if (a.score !== b.score) return b.score - a.score;
  if (a.effectiveTimeMs !== b.effectiveTimeMs) return a.effectiveTimeMs - b.effectiveTimeMs;
  if ((a.wrong || 0) !== (b.wrong || 0)) return (a.wrong || 0) - (b.wrong || 0);
  return (a.finishedAt || Infinity) - (b.finishedAt || Infinity);
}

// Helper to check if a student belongs to one of the session classes
async function isStudentAllowed(session, studentId) {
  if (!Array.isArray(session.classes) || session.classes.length === 0) return true;
  const count = await Class.countDocuments({ _id: { $in: session.classes }, 'enrolledStudents.studentId': studentId });
  return count > 0;
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Identify user and join role-based rooms (for teacher updates)
  socket.on('identify', ({ userId, role }) => {
    try {
      socket.data.userId = userId;
      socket.data.role = role;
      if (role === 'teacher' && userId) {
        socket.join(`teacher:${userId}`);
      }
    } catch {}
  });

  socket.on('host-game', async (payload) => {
    try {
      // Backward compatibility: payload may be a string (gameCreationId)
      if (typeof payload === 'string') {
        const gameCreationId = payload;
        const code = (Math.random().toString(36).slice(2).toUpperCase()+Math.random().toString(36).slice(2).toUpperCase()).replace(/[^A-Z0-9]/g,'').slice(0,8) || 'ABCDEFGH';
        socket.join(code);
        liveGames[code] = { hostId: socket.id, gameCreationId, players: [], allowLateJoin: true, stats: {}, sessionConfig: null };
        socket.emit('room-created', code);
        return;
      }

      // New shape: { code?, sessionId?, gameCreationId, ... }
      const { code: providedCode, sessionId, gameCreationId } = payload || {};
      if (providedCode) {
        socket.join(providedCode);
        if (!liveGames[providedCode]) liveGames[providedCode] = { hostId: socket.id, gameCreationId, players: [], allowLateJoin: true, stats: {}, sessionId, sessionConfig: null };
        else liveGames[providedCode].hostId = socket.id;
        socket.emit('room-created', providedCode);
        return;
      }

      const code = (Math.random().toString(36).slice(2).toUpperCase()+Math.random().toString(36).slice(2).toUpperCase()).replace(/[^A-Z0-9]/g,'').slice(0,8) || 'ABCDEFGH';
      socket.join(code);
      liveGames[code] = { hostId: socket.id, gameCreationId, players: [], allowLateJoin: true, stats: {}, sessionId, sessionConfig: null };
      socket.emit('room-created', code);
    } catch (e) {
      socket.emit('join-error', 'Failed to create room');
    }
  });

  // --- UPDATED: Now accepts and stores the student's userId ---
  socket.on('join-game', async ({ roomCode, playerName, userId }) => {
    try {
      if (!liveGames[roomCode]) return socket.emit('join-error', 'Room not found.');
      const sessId = liveGames[roomCode].sessionId;
      if (sessId) {
        const s = await LiveSession.findOne({ _id: sessId });
        if (!s) return socket.emit('join-error', 'Session not found.');
        if (s.status === 'ended') return socket.emit('join-error', 'Session ended.');
        // Late-join policy: when running and late-join disabled, only allow reconnects for previously known players
        if (s.status === 'running' && s.allowLateJoin === false) {
          const stats = liveGames[roomCode].stats || {};
          const wasInRoom = !!stats[userId];
          if (!wasInRoom) return socket.emit('join-error', 'Late join is not allowed for this session.');
        }
        // Block teachers from joining as players
        if (socket?.data?.role === 'teacher') {
          return socket.emit('join-error', 'Teachers cannot join as players.');
        }
        const allowed = await isStudentAllowed(s, userId);
        if (!allowed) return socket.emit('join-error', 'Not allowed for this session');
      }

      socket.join(roomCode);
      const newPlayer = { id: socket.id, name: playerName, userId };
      const arr = liveGames[roomCode].players;
      // Ensure single entry per userId; replace socket.id if rejoining
      const idx = arr.findIndex(p => String(p.userId) === String(userId));
      if (idx === -1) arr.push(newPlayer); else arr[idx] = newPlayer;
      // init stats
      const stats = liveGames[roomCode].stats || (liveGames[roomCode].stats = {});
      if (!stats[userId]) stats[userId] = { score: 0, correct: 0, wrong: 0, effectiveTimeMs: 0, finishedAt: null };

      // Persist participant best-effort
      try {
        if (sessId) {
          const user = await User.findById(userId).select('firstName lastName');
          // If session is class-scoped, capture the student's classId (first match)
          let classId = undefined;
          try {
            const sess = await LiveSession.findById(sessId).select('classes').lean();
            if (Array.isArray(sess?.classes) && sess.classes.length) {
              const c = await Class.findOne({ _id: { $in: sess.classes }, 'enrolledStudents.studentId': userId }).select('_id').lean();
              classId = c?._id;
            }
          } catch {}
          await LiveParticipant.updateOne(
            { sessionId: sessId, studentId: userId },
            { $setOnInsert: { sessionId: sessId, studentId: userId, firstName: user?.firstName, lastName: user?.lastName, classId } },
            { upsert: true }
          );
        }
      } catch {}

      const hostId = liveGames[roomCode].hostId;
      io.to(hostId).emit('player-joined', liveGames[roomCode].players);
      // Notify the teacher of participant count changes if session is bound
      try {
        if (sessId && s?.teacherId) {
          io.to(`teacher:${s.teacherId}`).emit('live:session-count', { sessionId: sessId, participantsCount: (liveGames[roomCode].players || []).length });
        }
      } catch {}
      // Send current state to the joiner
      socket.emit('join-success', { roomCode });
      try {
        const s = liveGames[roomCode];
        const ranks = Object.entries(s.stats).map(([sid,st])=>({ userId: sid, name: (s.players||[]).find(p=>String(p.userId)===String(sid))?.name, ...st })).sort((a,b)=>rankComparator(a,b));
        socket.emit('live:scoreboard', { ranks });
        // If session already running, let this player start immediately
        if (sessId) {
          try {
            const sessDoc = await LiveSession.findById(sessId).select('status gameCreationId').lean();
            if (sessDoc?.status === 'running') {
              socket.emit('game-started', { gameCreationId: s.gameCreationId });
            }
          } catch {}
        }
      } catch {}
    } catch (e) { socket.emit('join-error', 'Join failed'); }
  });

  socket.on('start-game', async (roomCode) => {
    try {
      if (liveGames[roomCode] && liveGames[roomCode].hostId === socket.id) {
        const gameCreationId = liveGames[roomCode].gameCreationId;
        io.to(roomCode).emit('game-started', { gameCreationId });
        if (liveGames[roomCode].sessionId) {
          // Cache session config (penalties, scoring) for faster access in live updates
          try {
            const sess = await LiveSession.findById(liveGames[roomCode].sessionId).lean();
            liveGames[roomCode].sessionConfig = sess?.config || null;
            await LiveSession.findByIdAndUpdate(liveGames[roomCode].sessionId, { status: 'running', startedAt: new Date(), allowLateJoin: false });
          } catch {}
        }
      }
    } catch {}
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Remove disconnected player(s) from any live rooms and emit count updates
    try {
      const codes = Object.keys(liveGames);
      codes.forEach(async (code) => {
        const room = liveGames[code];
        if (!room?.players?.length) return;
        const before = room.players.length;
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length !== before) {
          // Emit to host updated list
          try { io.to(room.hostId).emit('player-joined', room.players); } catch {}
          // Emit to teacher updated participantsCount
          if (room.sessionId) {
            try {
              const sess = await LiveSession.findById(room.sessionId).select('teacherId').lean();
              if (sess?.teacherId) io.to(`teacher:${sess.teacherId}`).emit('live:session-count', { sessionId: room.sessionId, participantsCount: room.players.length });
            } catch {}
          }
        }
      });
    } catch {}
  });

  // Live answers update
  socket.on('live:answer', async ({ roomCode, userId, correct, deltaMs, scoreDelta, currentScore }) => {
    try {
      const room = liveGames[roomCode];
      if (!room) return;
      let elapsed = Number.isFinite(deltaMs) ? Number(deltaMs) : 0; // time since previous question (client-reported)
      // Clamp per-question elapsed time to prevent abuse (0..60s)
      if (elapsed < 0) elapsed = 0;
      if (elapsed > 60000) elapsed = 60000;
      const penaltyPerWrong = Number(room.sessionConfig?.timePenaltyPerWrongMs ?? 3000);
      const stats = room.stats || (room.stats = {});
      const st = stats[userId] || (stats[userId] = { score: 0, correct: 0, wrong: 0, effectiveTimeMs: 0, rawTimeMs: 0, finishedAt: null });
      st.rawTimeMs = (st.rawTimeMs || 0) + elapsed;
      st.effectiveTimeMs += elapsed;
      if (correct === true) { st.correct += 1; }
      else if (correct === false) { st.wrong += 1; st.effectiveTimeMs += penaltyPerWrong; }
      // Engines can control scoring increments
      if (Number.isFinite(Number(currentScore))) {
        st.score = Number(currentScore);
      } else if (Number.isFinite(Number(scoreDelta))) {
        st.score += Number(scoreDelta);
      } else if (correct === true) {
        st.score += 1;
      }
      // Broadcast leaderboard
      const ranks = Object.entries(stats).map(([sid, s]) => ({ userId: sid, name: (room.players||[]).find(p=>String(p.userId)===String(sid))?.name, ...s })).sort((a,b)=>rankComparator(a,b));
      io.to(roomCode).emit('live:scoreboard', { ranks });
      // Persist best-effort
      try {
        if (room.sessionId) {
          await LiveParticipant.updateOne(
            { sessionId: room.sessionId, studentId: userId },
            { $set: { score: st.score, correct: st.correct, wrong: st.wrong, effectiveTimeMs: st.effectiveTimeMs, rawTimeMs: st.rawTimeMs, lastPingAt: new Date() } },
            { upsert: true }
          );
        }
      } catch {}
    } catch {}
  });

  socket.on('live:finish', async ({ roomCode, userId, totalTimeMs }) => {
    try {
      const room = liveGames[roomCode];
      if (!room) return;
      const stats = room.stats || (room.stats = {});
      const st = stats[userId] || (stats[userId] = { score: 0, correct: 0, wrong: 0, effectiveTimeMs: 0, rawTimeMs: 0, finishedAt: null });
      if (Number.isFinite(totalTimeMs)) st.effectiveTimeMs = Math.max(st.effectiveTimeMs, Number(totalTimeMs));
      st.finishedAt = st.finishedAt || Date.now();
      const ranks = Object.entries(stats).map(([sid, s]) => ({ userId: sid, name: (room.players||[]).find(p=>String(p.userId)===String(sid))?.name, ...s })).sort((a,b)=>rankComparator(a,b));
      io.to(roomCode).emit('live:scoreboard', { ranks });
      try {
        if (room.sessionId) await LiveParticipant.updateOne(
          { sessionId: room.sessionId, studentId: userId },
          { $set: { finishedAt: new Date(), effectiveTimeMs: st.effectiveTimeMs, rawTimeMs: st.rawTimeMs } }
        );
      } catch {}

      // Auto-end the session when all current players have finished
      try {
        if (!room.ended) {
          const userIds = Array.from(new Set((room.players || []).map(p => String(p.userId))));
          const finishedCount = userIds.filter(uid => !!stats[uid]?.finishedAt).length;
          if (userIds.length > 0 && finishedCount === userIds.length) {
            room.ended = true;
            // Update DB session status
            if (room.sessionId) {
              try { await LiveSession.findByIdAndUpdate(room.sessionId, { status: 'ended', endedAt: new Date() }); } catch {}
            }
            io.to(roomCode).emit('game-ended', { roomCode, sessionId: room.sessionId });
          }
        }
      } catch {}
    } catch {}
  });

  socket.on('end-game', async (roomCode) => {
    try {
      const room = liveGames[roomCode];
      if (!room || room.hostId !== socket.id) return;
      if (room.sessionId) { await LiveSession.findByIdAndUpdate(room.sessionId, { status: 'ended', endedAt: new Date() }); }
      io.to(roomCode).emit('game-ended', { roomCode, sessionId: room.sessionId });
      // Notify teacher the session effectively ended and freeze count
      try {
        if (room.sessionId) {
          const sess = await LiveSession.findById(room.sessionId).select('teacherId').lean();
          if (sess?.teacherId) io.to(`teacher:${sess.teacherId}`).emit('live:session-count', { sessionId: room.sessionId, participantsCount: room.players?.length || 0 });
        }
      } catch {}
    } catch {}
  });
});

// --- NEW: Middleware to attach io and liveGames to each request ---
// This makes them accessible in our controllers.
app.use((req, res, next) => {
  req.io = io;
  req.liveGames = liveGames;
  next();
});

// --- Serve static files ---
// 1. Engines FIRST (critical - must be before React Router)
app.use('/engines', (req, res, next) => {
  console.log(`🔧 [ENGINE] Request for: ${req.path}`);
  next();
}, express.static(path.join(__dirname, 'public', 'engines')));

// 2. Other static assets
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/badge-icons', express.static(path.join(__dirname, 'public', 'badge-icons')));
app.use('/school-documents', express.static(path.join(__dirname, 'public', 'school-documents')));

// 3. React build (production only)
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));

  // 4. SPA fallback (React Router) - MUST BE LAST
  app.get('*', (req, res) => {
    console.log(`⚛️ [REACT] Fallback for: ${req.path}`);
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}


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

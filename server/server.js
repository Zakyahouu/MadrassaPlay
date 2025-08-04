// server/server.js

// 1. IMPORT PACKAGES
// ==============================================================================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const connectDB = require('./config/db');
const path = require('path');
// Import route files
const userRoutes = require('./routes/userRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const gameTemplateRoutes = require('./routes/gameTemplateRoutes');
const gameCreationRoutes = require('./routes/gameCreationRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const gameResultRoutes = require('./routes/gameResultRoutes');


// 2. INITIALIZE THE APP & SERVER
// ==============================================================================
connectDB();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;


// 3. MIDDLEWARE
// ==============================================================================
app.use(express.json());

// --- NEW: Middleware to attach io and liveGames to each request ---
// This makes them accessible in our controllers.
app.use((req, res, next) => {
  req.io = io;
  req.liveGames = liveGames;
  next();
});

// Serve static game engines from /public/engines
app.use('/engines', express.static(path.join(__dirname, 'public', 'engines')));

// Serve React app static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));
  // Fallback for React Router (SPA)
  app.get('*', (req, res) => {
    // If the request is for an engine, let the static middleware handle it
    if (req.path.startsWith('/engines/')) return;
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}


// 4. DEFINE ROUTES
// ==============================================================================
app.use('/api/users', userRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/templates', gameTemplateRoutes);
app.use('/api/creations', gameCreationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/results', gameResultRoutes);
// Register class routes
const classRoutes = require('./routes/classRoutes');
app.use('/api/classes', classRoutes);

// Register payment routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);


// 5. SOCKET.IO CONNECTION HANDLING
// ==============================================================================
const liveGames = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('host-game', (gameCreationId) => {
    const roomCode = Math.floor(10000 + Math.random() * 90000).toString();
    console.log(`Teacher ${socket.id} is hosting game ${gameCreationId} in room ${roomCode}`);
    socket.join(roomCode);
    
    liveGames[roomCode] = {
      hostId: socket.id,
      gameCreationId: gameCreationId,
      players: []
    };

    socket.emit('room-created', roomCode);
  });

  // --- UPDATED: Now accepts and stores the student's userId ---
  socket.on('join-game', ({ roomCode, playerName, userId }) => {
    if (liveGames[roomCode]) {
      console.log(`Player ${playerName} (User ID: ${userId}) is joining room ${roomCode}`);
      socket.join(roomCode);

      // Store the player's socket id, name, AND their persistent userId
      const newPlayer = { id: socket.id, name: playerName, userId: userId };
      liveGames[roomCode].players.push(newPlayer);

      const hostId = liveGames[roomCode].hostId;
      io.to(hostId).emit('player-joined', liveGames[roomCode].players);

      socket.emit('join-success', { roomCode });

    } else {
      socket.emit('join-error', 'Room not found. Please check the code.');
    }
  });

  socket.on('start-game', (roomCode) => {
    console.log(`Teacher is starting game for room ${roomCode}`);
    if (liveGames[roomCode] && liveGames[roomCode].hostId === socket.id) {
      const gameCreationId = liveGames[roomCode].gameCreationId;
      io.to(roomCode).emit('game-started', { gameCreationId });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});


// 6. START THE SERVER
// ==============================================================================
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

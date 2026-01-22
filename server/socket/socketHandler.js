const { liveGames } = require('../realtimeState');
const LiveParticipant = require('../models/LiveParticipant');
const LiveSession = require('../models/LiveSession');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function(io) {
  if (!io) return;

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      if (!token) {
        // Allow connection but mark as unauthenticated
        // Some connections may be guest players in games
        socket._authenticated = false;
        socket._user = null;
        console.log('[socket] unauthenticated connection', socket.id);
        return next();
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('_id role school firstName lastName').lean();
        
        if (!user) {
          socket._authenticated = false;
          socket._user = null;
          console.log('[socket] token valid but user not found', socket.id);
          return next();
        }

        socket._authenticated = true;
        socket._user = user;
        console.log('[socket] authenticated', socket.id, user.role, user._id);
        return next();
      } catch (jwtError) {
        // Invalid token - allow connection but mark as unauthenticated
        socket._authenticated = false;
        socket._user = null;
        console.log('[socket] invalid token', socket.id, jwtError.message);
        return next();
      }
    } catch (error) {
      console.error('[socket] auth middleware error', error);
      socket._authenticated = false;
      socket._user = null;
      return next();
    }
  });

  io.on('connection', (socket) => {
    console.log('[socket] connected', socket.id, 'authenticated:', socket._authenticated);

    socket.on('identify', (payload) => {
      try {
        const { role, userId } = payload || {};
        
        // If socket is authenticated, verify the userId matches
        if (socket._authenticated && socket._user) {
          if (userId && userId !== socket._user._id.toString()) {
            console.warn('[socket] identify userId mismatch - token user:', socket._user._id, 'claimed:', userId);
            socket.emit('auth-error', 'User ID mismatch');
            return;
          }
          // Use verified user data instead of client-provided data
          socket._identified = { 
            role: socket._user.role, 
            userId: socket._user._id.toString(),
            verified: true
          };
        } else {
          // For unauthenticated connections, trust client data but mark as unverified
          socket._identified = { role, userId, verified: false };
        }
        console.log('[socket] identify', socket.id, socket._identified);
      } catch (e) { console.warn('identify handler failed', e); }
    });

    socket.on('host-game', ({ code, sessionId, gameCreationId } = {}) => {
      try {
        // Require authentication for hosting games
        if (!socket._authenticated) {
          socket.emit('host-error', 'Authentication required to host games');
          console.warn('[socket] unauthenticated host-game attempt', socket.id);
          return;
        }
        
        if (!code) return;
        const room = liveGames[code] = liveGames[code] || { players: [], sessionId: null, gameCreationId: null, status: 'lobby', hostUserId: socket._user._id.toString() };
        room.sessionId = sessionId || room.sessionId;
        room.gameCreationId = gameCreationId || room.gameCreationId;
        room.status = 'lobby';
        room.hostUserId = socket._user._id.toString();
        // join the socket to the room so emits can target it
        socket.join(code);

        // Send room-created to host only
        io.to(socket.id).emit('room-created', code);

        // Notify any listeners about current players (likely empty at host creation)
        io.to(code).emit('player-joined', room.players.slice());
        console.log('[socket] host-game -> created room', code);
      } catch (e) { console.error('host-game handler failed', e); }
    });

    socket.on('join-game', async ({ roomCode, playerName, userId } = {}) => {
      try {
        const room = liveGames[roomCode];
        if (!room) { socket.emit('join-error', 'Room not found'); return; }
        
        // add or update player in memory
        const existing = room.players.find(p => String(p.userId) === String(userId));
        if (!existing) {
          const player = { id: socket.id, userId, name: playerName };
          room.players.push(player);
        } else {
          existing.id = socket.id;
          existing.name = playerName;
        }
        socket.join(roomCode);
        
        // ✅ Create or update LiveParticipant in database
        if (room.sessionId && userId) {
          try {
            const User = require('../models/User');
            const student = await User.findById(userId).select('firstName lastName').lean();
            
            // Find which class this student belongs to from the session's classes
            const session = await LiveSession.findById(room.sessionId).select('classes').lean();
            
            let studentClassId = null;
            if (session && session.classes && session.classes.length > 0) {
              // Check if student is enrolled in any of the session's classes
              const Enrollment = require('../models/Enrollment');
              const enrollment = await Enrollment.findOne({
                studentId: userId,
                classId: { $in: session.classes },
                status: 'active'
              }).select('classId').lean();
              
              if (enrollment) {
                studentClassId = enrollment.classId;
              } else if (session.classes.length > 0) {
                // Fallback: use first class if no enrollment found
                studentClassId = session.classes[0];
              }
            }
            
            // Create or update participant record
            await LiveParticipant.findOneAndUpdate(
              { sessionId: room.sessionId, studentId: userId },
              {
                $set: {
                  firstName: student?.firstName || playerName?.split(' ')[0] || 'Student',
                  lastName: student?.lastName || playerName?.split(' ')[1] || '',
                  classId: studentClassId,
                  lastPingAt: new Date()
                },
                $setOnInsert: {
                  joinedAt: new Date(),
                  score: 0,
                  correct: 0,
                  wrong: 0,
                  rawTimeMs: 0,
                  effectiveTimeMs: 0
                }
              },
              { upsert: true, new: true }
            );
            
            console.log('[socket] LiveParticipant created/updated for', playerName, 'in session', room.sessionId);
          } catch (e) {
            console.error('[socket] Failed to create LiveParticipant:', e);
          }
        }
        
        io.to(roomCode).emit('player-joined', room.players.slice());
        io.to(roomCode).emit('live:session-count', { sessionId: room.sessionId, participantsCount: room.players.length });
        console.log('[socket] player joined', playerName, '->', roomCode);
      } catch (e) { console.error('join-game handler failed', e); }
    });

    socket.on('start-game', (roomCode) => {
      try {
        const room = liveGames[roomCode];
        if (!room) return;
        room.status = 'running';
        io.to(roomCode).emit('game-started', { gameCreationId: room.gameCreationId, sessionId: room.sessionId });
        console.log('[socket] start-game ->', roomCode);
      } catch (e) { console.error('start-game handler failed', e); }
    });

    socket.on('end-game', async (roomCode) => {
      try {
        const room = liveGames[roomCode];
        if (!room) return;
        
        // Update session status in database
        if (room.sessionId) {
          try {
            const session = await LiveSession.findById(room.sessionId);
            if (session && session.status !== 'ended') {
              session.status = 'ended';
              session.endedAt = new Date();
              if (!session.startedAt) session.startedAt = session.createdAt || new Date();
              await session.save();
              console.log('[socket] end-game -> session marked as ended:', room.sessionId);
            }
          } catch (e) {
            console.error('[socket] Failed to update session status:', e);
          }
        }
        
        io.to(roomCode).emit('game-ended', { sessionId: room.sessionId });
        // remove live game state
        try { delete liveGames[roomCode]; } catch {}
        console.log('[socket] end-game ->', roomCode);
      } catch (e) { console.error('end-game handler failed', e); }
    });

    // ✅ Handle live answer submissions from players
    socket.on('live:answer', async ({ roomCode, userId, correct, deltaMs, scoreDelta, currentScore } = {}) => {
      try {
        const room = liveGames[roomCode];
        if (!room || !room.sessionId) return;

        console.log('[socket] live:answer ->', { roomCode, userId, correct, deltaMs, scoreDelta, currentScore });

        // Update participant record
        try {
          const participant = await LiveParticipant.findOne({ 
            sessionId: room.sessionId, 
            studentId: userId 
          });

          if (participant) {
            // Update stats
            if (correct) {
              participant.correct = (participant.correct || 0) + 1;
            } else {
              participant.wrong = (participant.wrong || 0) + 1;
            }
            
            if (typeof currentScore === 'number') {
              participant.score = currentScore;
            } else if (typeof scoreDelta === 'number') {
              participant.score = (participant.score || 0) + scoreDelta;
            }

            // Add time penalty for wrong answers (3 seconds per wrong)
            const timePenaltyMs = correct ? 0 : 3000;
            participant.effectiveTimeMs = (participant.effectiveTimeMs || 0) + deltaMs + timePenaltyMs;

            await participant.save();

            // Fetch all participants and calculate ranks
            const allParticipants = await LiveParticipant.find({ 
              sessionId: room.sessionId 
            }).populate('studentId', 'name').lean();

            const ranks = allParticipants
              .map(p => ({
                userId: String(p.studentId?._id || p.studentId),
                name: p.studentId?.name || 'Unknown',
                score: p.score || 0,
                correct: p.correct || 0,
                wrong: p.wrong || 0,
                effectiveTimeMs: p.effectiveTimeMs || 0,
                finishedAt: p.finishedAt
              }))
              .sort((a, b) => {
                // Sort by score desc, then by time asc, then by wrong asc
                if (b.score !== a.score) return b.score - a.score;
                if (a.effectiveTimeMs !== b.effectiveTimeMs) return a.effectiveTimeMs - b.effectiveTimeMs;
                return (a.wrong || 0) - (b.wrong || 0);
              });

            // Emit updated scoreboard to everyone in the room
            io.to(roomCode).emit('live:scoreboard', { ranks });
            console.log('[socket] live:scoreboard emitted ->', ranks.length, 'participants');
          } else {
            console.warn('[socket] live:answer - participant not found:', { sessionId: room.sessionId, userId });
          }
        } catch (e) {
          console.error('[socket] Failed to update participant:', e);
        }
      } catch (e) {
        console.error('[socket] live:answer handler failed', e);
      }
    });

    // ✅ Handle when a player finishes the game
    socket.on('live:finish', async ({ roomCode, userId, totalTimeMs } = {}) => {
      try {
        const room = liveGames[roomCode];
        if (!room || !room.sessionId) return;

        console.log('[socket] live:finish ->', { roomCode, userId, totalTimeMs });

        // Mark participant as finished
        try {
          const participant = await LiveParticipant.findOne({ 
            sessionId: room.sessionId, 
            studentId: userId 
          });

          if (participant && !participant.finishedAt) {
            participant.finishedAt = new Date();
            if (typeof totalTimeMs === 'number') {
              participant.effectiveTimeMs = totalTimeMs;
            }
            await participant.save();

            // Check if all participants have finished
            const allParticipants = await LiveParticipant.find({ 
              sessionId: room.sessionId 
            }).lean();

            const allFinished = allParticipants.every(p => p.finishedAt);
            const finishedCount = allParticipants.filter(p => p.finishedAt).length;

            console.log('[socket] Participants finished:', finishedCount, '/', allParticipants.length);

            // Emit final scoreboard
            const ranks = allParticipants
              .map(p => ({
                userId: String(p.studentId),
                name: p.studentId?.name || 'Unknown',
                score: p.score || 0,
                correct: p.correct || 0,
                wrong: p.wrong || 0,
                effectiveTimeMs: p.effectiveTimeMs || 0,
                finishedAt: p.finishedAt
              }))
              .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (a.effectiveTimeMs !== b.effectiveTimeMs) return a.effectiveTimeMs - b.effectiveTimeMs;
                return (a.wrong || 0) - (b.wrong || 0);
              });

            io.to(roomCode).emit('live:scoreboard', { ranks });

            // If all finished, auto-end the session after a short delay
            if (allFinished) {
              console.log('[socket] All participants finished! Auto-ending session in 3 seconds...');
              setTimeout(async () => {
                try {
                  const session = await LiveSession.findById(room.sessionId);
                  if (session && session.status !== 'ended') {
                    session.status = 'ended';
                    session.endedAt = new Date();
                    if (!session.startedAt) session.startedAt = session.createdAt || new Date();
                    await session.save();
                  }
                  io.to(roomCode).emit('game-ended', { sessionId: room.sessionId, autoEnded: true });
                  delete liveGames[roomCode];
                  console.log('[socket] Session auto-ended:', room.sessionId);
                } catch (e) {
                  console.error('[socket] Auto-end failed:', e);
                }
              }, 3000);
            }
          }
        } catch (e) {
          console.error('[socket] Failed to update participant finish:', e);
        }
      } catch (e) {
        console.error('[socket] live:finish handler failed', e);
      }
    });

    socket.on('disconnect', () => {
      try {
        console.log('[socket] disconnected', socket.id);
        // remove from any rooms' player lists
        for (const code of Object.keys(liveGames)) {
          const room = liveGames[code];
          const before = room.players.length;
          room.players = room.players.filter(p => p.id !== socket.id);
          if (room.players.length !== before) {
            io.to(code).emit('player-joined', room.players.slice());
            io.to(code).emit('live:session-count', { sessionId: room.sessionId, participantsCount: room.players.length });
          }
        }
      } catch (e) { console.error('disconnect cleanup failed', e); }
    });
  });
};

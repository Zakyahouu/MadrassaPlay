const { liveGames } = require('../realtimeState');

module.exports = function(io) {
  if (!io) return;

  io.on('connection', (socket) => {
    console.log('[socket] connected', socket.id);

    socket.on('identify', (payload) => {
      try {
        const { role, userId } = payload || {};
        socket._identified = { role, userId };
        console.log('[socket] identify', socket.id, role, userId);
      } catch (e) { console.warn('identify handler failed', e); }
    });

    socket.on('host-game', ({ code, sessionId, gameCreationId } = {}) => {
      try {
        if (!code) return;
        const room = liveGames[code] = liveGames[code] || { players: [], sessionId: null, gameCreationId: null, status: 'lobby' };
        room.sessionId = sessionId || room.sessionId;
        room.gameCreationId = gameCreationId || room.gameCreationId;
        room.status = 'lobby';
        // join the socket to the room so emits can target it
        socket.join(code);

        // Send room-created to host only
        io.to(socket.id).emit('room-created', code);

        // Notify any listeners about current players (likely empty at host creation)
        io.to(code).emit('player-joined', room.players.slice());
        console.log('[socket] host-game -> created room', code);
      } catch (e) { console.error('host-game handler failed', e); }
    });

    socket.on('join-game', ({ roomCode, playerName, userId } = {}) => {
      try {
        const room = liveGames[roomCode];
        if (!room) { socket.emit('join-error', 'Room not found'); return; }
        // add or update player
        const existing = room.players.find(p => String(p.userId) === String(userId));
        if (!existing) {
          const player = { id: socket.id, userId, name: playerName };
          room.players.push(player);
        } else {
          existing.id = socket.id;
          existing.name = playerName;
        }
        socket.join(roomCode);
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

    socket.on('end-game', (roomCode) => {
      try {
        const room = liveGames[roomCode];
        if (!room) return;
        io.to(roomCode).emit('game-ended', { sessionId: room.sessionId });
        // remove live game state
        try { delete liveGames[roomCode]; } catch {}
        console.log('[socket] end-game ->', roomCode);
      } catch (e) { console.error('end-game handler failed', e); }
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

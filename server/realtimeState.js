// server/realtimeState.js
// Centralized realtime state so both app (Express routes) and server (Socket.IO) can access it.

// Live games registry keyed by room code
const liveGames = {};

// Socket.IO instance holder (set from server.js after creation)
let io = null;

function setIO(instance) {
  io = instance;
}

function getIO() {
  return io;
}

module.exports = {
  liveGames,
  setIO,
  get io() { return io; },
};

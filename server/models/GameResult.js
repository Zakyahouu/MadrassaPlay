// server/models/GameResult.js

const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema(
  {
    // The student who played the game
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // The specific game creation that was played
    gameCreation: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'GameCreation',
    },
    // The assignment this result belongs to (optional for live sessions)
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Assignment',
    },
    // The score the student achieved
    score: {
      type: Number,
      required: true,
    },
    // The total possible score for this game
  totalPossibleScore: {
    type: Number,
    required: true,
  },
  // Attempt sequence number for this assignment/game pair
  attemptNumber: { type: Number, default: 1 },
  // Whether this attempt counts towards official reports (e.g., first-only policy)
  counted: { type: Boolean, default: true },
  // True when initiated by admin/teacher (test/hotspot), never grants XP
  isTest: { type: Boolean, default: false },
  // XP awarded for this attempt (0 for non-counted or tests)
  xpAwarded: { type: Number, default: 0 },
  // Optional live session id if this result comes from a real-time session
  liveSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession' },
  // Optional per-question answers for full teacher report (engine-specific shape)
  // Use Mixed to preserve engine-provided fields like { index, correct, selectedIndex, guess, target, deltaMs, ... }
  answers: {
    type: [mongoose.Schema.Types.Mixed],
    default: undefined,
  },
  },
  {
    timestamps: true,
  }
);

// Performance indexes for frequent query patterns
// Composite index accelerates filtering by student + assignment + gameCreation
gameResultSchema.index({ student: 1, assignment: 1, gameCreation: 1 });
// Secondary index for assignment aggregations (teacher analytics potential)
gameResultSchema.index({ assignment: 1 });
// Index for template badge evaluation by gameCreation & student
gameResultSchema.index({ gameCreation: 1, student: 1 });
// Index to quickly find counted attempts
gameResultSchema.index({ assignment: 1, gameCreation: 1, student: 1, counted: 1 });
// Index for live session lookups (student recent live results)
gameResultSchema.index({ liveSessionId: 1, student: 1, createdAt: -1 });

module.exports = mongoose.model('GameResult', gameResultSchema);

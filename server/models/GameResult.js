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
    // The assignment this result belongs to
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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
  attemptNumber: { type: Number, default: 1 }
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

module.exports = mongoose.model('GameResult', gameResultSchema);

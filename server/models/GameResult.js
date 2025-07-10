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
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GameResult', gameResultSchema);

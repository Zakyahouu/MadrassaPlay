// server/models/GameCreation.js

const mongoose = require('mongoose');

const gameCreationSchema = new mongoose.Schema(
  {
    // The teacher who created this game
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // The template this game is based on
    template: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'GameTemplate',
    },
    // The custom name the teacher gave this game instance
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // The specific settings and content the teacher configured
    // This will store the 'gameData' object from our frontend form.
    config: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    content: {
      type: Array,
      required: true,
    },
    // Snapshot the engine path/version from the template at creation time
    enginePath: { type: String },
    engineVersion: { type: String },
    // Policy snapshot for attempts and xp (derived from template manifest at creation)
    attemptPolicy: { type: String, enum: ['first_only', 'all'], default: 'first_only' },
  // Optional tag for teacher-chosen level label (e.g., "Level X" or "Arabic B1" or "Any")
  levelLabel: { type: String },
  // Legacy (unused) optional tag for school-defined level kept for backward compatibility
  levelId: { type: mongoose.Schema.Types.ObjectId },
    xp: {
      assignment: {
        enabled: { type: Boolean, default: true },
        amount: { type: Number, default: 0 },
        firstAttemptOnly: { type: Boolean, default: true },
      },
      online: {
        enabled: { type: Boolean, default: false },
        amount: { type: Number, default: 0 },
      }
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GameCreation', gameCreationSchema);

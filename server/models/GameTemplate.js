// server/models/GameTemplate.js

const mongoose = require('mongoose');

const gameTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    // --- Platform Integration & Gamification ---
    platformIntegration: {
      isScored: { type: Boolean, default: true },
      feedbackModel: { type: String, enum: ['instant', 'summary'], default: 'instant' },
    },
    gamification: {
      xpAwardedOnCompletion: { type: Number, default: 50 },
      unlocksBadgeId: { type: String },
    },
    // --- Dynamic Form Schema for Teachers ---
    // We use 'Mixed' type to allow for a flexible, nested JSON object.
    // This is the core of our dynamic form generation.
    formSchema: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GameTemplate', gameTemplateSchema);

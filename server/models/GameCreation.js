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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GameCreation', gameCreationSchema);

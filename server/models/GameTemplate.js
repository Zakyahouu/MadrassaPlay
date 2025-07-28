// server/models/GameTemplate.js
const mongoose = require('mongoose');

// We are adding a 'status' field to our schema.
const gameTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  manifest: {
    type: Object,
    required: true,
  },
  formSchema: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published'], // The status can only be one of these two values
    default: 'draft', // New templates will automatically be set to 'draft'
  },
  enginePath: { // We will keep this field for when we add the engine files later
    type: String,
  },
}, {
  timestamps: true,
});

const GameTemplate = mongoose.model('GameTemplate', gameTemplateSchema);

module.exports = GameTemplate;

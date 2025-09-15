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
  // Raw manifest snapshot (immutable parts come from here)
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
  // ---- Admin editable presentation/meta overrides (do NOT alter manifest on disk) ----
  displayName: { type: String }, // optional nicer name
  tags: [{ type: String }],
  category: { type: String },
  iconUrl: { type: String },
  isFeatured: { type: Boolean, default: false },
  deprecated: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const GameTemplate = mongoose.model('GameTemplate', gameTemplateSchema);

module.exports = GameTemplate;

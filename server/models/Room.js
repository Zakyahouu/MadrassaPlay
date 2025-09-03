// server/models/Room.js

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  activityTypes: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// Compound index for school + room name uniqueness
roomSchema.index({ schoolId: 1, name: 1 }, { unique: true });
// Avoid redundant single-field index on schoolId; queries should leverage compound indexes.

module.exports = mongoose.model('Room', roomSchema);

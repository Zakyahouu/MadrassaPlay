// server/models/Class.js

const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  schedule: [
    {
      day: { type: String, required: true }, // e.g., 'Monday'
      time: { type: String, required: true }, // e.g., '7:00 PM'
    }
  ],
  subject: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  paymentRule: {
    type: Number, // e.g., 4 means payment every 4 sessions
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Class', classSchema);

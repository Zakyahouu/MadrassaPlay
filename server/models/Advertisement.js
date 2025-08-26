// server/models/Advertisement.js

const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  dateTime: {
    type: Date,
    required: true,
  },
  targetAudience: {
    type: String,
    enum: ['students', 'teachers', 'both', 'custom'],
    required: true,
  },
  location: {
    type: String,
    enum: ['dashboard', 'banner', 'notification', 'other'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for performance
advertisementSchema.index({ schoolId: 1 });
advertisementSchema.index({ dateTime: 1 });
advertisementSchema.index({ targetAudience: 1 });
advertisementSchema.index({ location: 1 });

module.exports = mongoose.model('Advertisement', advertisementSchema);
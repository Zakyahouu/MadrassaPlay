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
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
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
  // Optional banner image (served from /uploads)
  bannerImageUrl: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Indexes for performance
advertisementSchema.index({ targetAudience: 1 });
advertisementSchema.index({ location: 1 });

module.exports = mongoose.model('Advertisement', advertisementSchema);
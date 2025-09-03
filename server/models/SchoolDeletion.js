// server/models/SchoolDeletion.js

const mongoose = require('mongoose');

const schoolDeletionSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    unique: true,
  },
  deletionRequestedAt: {
    type: Date,
    default: Date.now,
  },
  scheduledDeletionAt: {
    type: Date,
    required: true,
  },
  dependencyCount: {
    users: { type: Number, default: 0 },
    classes: { type: Number, default: 0 },
    enrollments: { type: Number, default: 0 },
    payments: { type: Number, default: 0 },
    attendance: { type: Number, default: 0 },
    advertisements: { type: Number, default: 0 },
  },
  backupPath: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Indexes for performance (schoolId is already unique at field level)
schoolDeletionSchema.index({ scheduledDeletionAt: 1 });
schoolDeletionSchema.index({ status: 1 });

module.exports = mongoose.model('SchoolDeletion', schoolDeletionSchema);

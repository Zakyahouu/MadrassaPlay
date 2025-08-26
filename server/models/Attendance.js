// server/models/Attendance.js

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
  },
  sessionDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true,
  },
  charged: {
    type: Boolean,
    default: false,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  voided: {
    type: Boolean,
    default: false,
  },
  voidReason: {
    type: String,
    required: function() {
      return this.voided === true;
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for performance
attendanceSchema.index({ sessionDate: 1 });
attendanceSchema.index({ enrollmentId: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ charged: 1 });
attendanceSchema.index({ voided: 1 });

// Compound index for unique session per enrollment
attendanceSchema.index({ enrollmentId: 1, sessionDate: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

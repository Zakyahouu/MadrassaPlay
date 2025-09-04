// server/models/Attendance.js

const mongoose = require('mongoose');

// Helper to normalize a Date or YYYY-MM-DD string to UTC date-only (00:00:00Z)
function toUtcDateOnly(value) {
  if (!value) return value;
  const d = typeof value === 'string' ? new Date(value + 'T00:00:00.000Z') : new Date(value);
  // Force to start of day UTC
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const attendanceSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    // UTC date-only (00:00:00Z)
    date: {
      type: Date,
      required: true,
      set: toUtcDateOnly,
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Indexes for scale
attendanceSchema.index({ enrollmentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ schoolId: 1, classId: 1, date: 1 });
attendanceSchema.index({ schoolId: 1, studentId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

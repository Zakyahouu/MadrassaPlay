// server/models/Enrollment.js

const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active',
  },
  cycleSizeAtEnrollment: {
    type: Number,
    required: true,
  },
  absenceDeductsAtEnrollment: {
    type: Boolean,
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index for unique student-class pairs and performance
enrollmentSchema.index({ classId: 1, studentId: 1 }, { unique: true });
enrollmentSchema.index({ schoolId: 1 });
enrollmentSchema.index({ studentId: 1 });
enrollmentSchema.index({ status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);

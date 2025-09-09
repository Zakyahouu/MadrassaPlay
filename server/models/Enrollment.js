// server/models/Enrollment.js

const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    // Tenant and relations
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },

    // Lifecycle
    status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
    enrolledAt: { type: Date, default: Date.now },

    // Pricing snapshot copied from Class at time of enrollment
    pricingSnapshot: {
      paymentModel: { type: String, enum: ['per_session', 'per_cycle'], required: true },
      sessionPrice: { type: Number, min: 0 },
      cycleSize: { type: Number, min: 1 },
      cyclePrice: { type: Number, min: 0 },
    },

    // Attendance counters (derived but persisted for quick displays)
    sessionCounters: {
      attended: { type: Number, default: 0, min: 0 },
      absent: { type: Number, default: 0, min: 0 },
      lastAttendanceDate: { type: Date },
    },


    // Balance of consumable sessions for this enrollment.
    // For per_session classes: number of sessions prepaid (can be fractional/negative)
    // For per_cycle classes: cycles are converted to sessions using cycleSize.
    // This is the SOURCE OF TRUTH for attendance consumption.
    balance: { type: Number, default: 0 },

    // Legacy fields kept for migration/backward compatibility (not used in new logic)
    // DEPRECATED: do not build new features on these fields.
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    totalSessions: { type: Number, required: false },
    sessionsCompleted: { type: Number, default: 0 },
    sessionsAttended: { type: Number, default: 0 },
    totalAmount: { type: Number, required: false },
    amountPaid: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    attendanceHistory: { type: Array, default: [] },
  },
  { timestamps: true }
);

// Indexes optimized for common queries
enrollmentSchema.index({ schoolId: 1, classId: 1, status: 1 });
enrollmentSchema.index({ schoolId: 1, studentId: 1, status: 1 });
// Unique active enrollment per (studentId, classId). Allows historical re-enrollments when not active.
enrollmentSchema.index(
  { studentId: 1, classId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

module.exports = mongoose.model('Enrollment', enrollmentSchema);

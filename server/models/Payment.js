// server/models/Payment.js

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: false }, // Optional for debt payments
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: false }, // Optional for debt payments
    amount: { type: Number, required: true, min: 1 }, // integers only
    kind: {
      type: String,
      enum: ['pay_sessions', 'pay_cycles', 'debt_payment'],
      required: true,
    },
    method: { type: String, enum: ['cash'], default: 'cash', required: true },
    note: { type: String, trim: true },
    // New evidence fields for debt tracking and units
    unitType: { type: String, enum: ['session', 'cycle'], default: undefined },
    units: { type: Number, min: 0 },
    expectedPrice: { type: Number, min: 0 },
    taken: { type: Number, min: 0 },
    // debtDelta = expectedPrice - taken; >0 student owes school, <0 school owes student
    debtDelta: { type: Number, default: 0 },
    idempotencyKey: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Indexes
paymentSchema.index({ schoolId: 1, enrollmentId: 1, createdAt: -1 });
paymentSchema.index({ schoolId: 1, studentId: 1, createdAt: -1 });
paymentSchema.index({ schoolId: 1, classId: 1, createdAt: -1 });
paymentSchema.index(
  { enrollmentId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

module.exports = mongoose.model('Payment', paymentSchema);

// server/models/Payment.js

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    amount: { type: Number, required: true, min: 1 }, // integers only
    kind: {
      type: String,
      enum: ['pay_sessions', 'pay_cycles'],
      required: true,
    },
    method: { type: String, enum: ['cash'], default: 'cash', required: true },
    note: { type: String, trim: true },
    idempotencyKey: { type: String, trim: true, sparse: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Indexes
paymentSchema.index({ schoolId: 1, enrollmentId: 1, createdAt: -1 });
paymentSchema.index({ schoolId: 1, studentId: 1, createdAt: -1 });
paymentSchema.index({ schoolId: 1, classId: 1, createdAt: -1 });
paymentSchema.index({ enrollmentId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);

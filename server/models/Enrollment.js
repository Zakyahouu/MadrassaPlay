// server/models/Enrollment.js

const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  // Student and Class references
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  
  // Enrollment details
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  // Payment and sessions
  totalSessions: {
    type: Number,
    required: [true, 'Total sessions is required'],
    min: [1, 'Total sessions must be at least 1']
  },
  
  sessionsCompleted: {
    type: Number,
    default: 0,
    min: [0, 'Sessions completed cannot be negative']
  },
  
  sessionsAttended: {
    type: Number,
    default: 0,
    min: [0, 'Sessions attended cannot be negative']
  },
  
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  
  amountPaid: {
    type: Number,
    default: 0,
    min: [0, 'Amount paid cannot be negative']
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'suspended', 'cancelled'],
    default: 'active'
  },
  
  // Notes and metadata
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Attendance tracking
  attendanceHistory: [{
    sessionDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true
    },
    notes: String,
    recordedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Virtual for remaining sessions
enrollmentSchema.virtual('remainingSessions').get(function() {
  return this.totalSessions - this.sessionsCompleted;
});

// Virtual for attendance percentage
enrollmentSchema.virtual('attendancePercentage').get(function() {
  if (this.sessionsCompleted === 0) return 0;
  return Math.round((this.sessionsAttended / this.sessionsCompleted) * 100);
});

// Virtual for payment status
enrollmentSchema.virtual('paymentStatus').get(function() {
  if (this.amountPaid >= this.totalAmount) return 'paid';
  if (this.amountPaid > 0) return 'partial';
  return 'unpaid';
});

// Virtual for balance
enrollmentSchema.virtual('balance').get(function() {
  return this.totalAmount - this.amountPaid;
});

// Ensure virtual fields are serialized
enrollmentSchema.set('toJSON', { virtuals: true });
enrollmentSchema.set('toObject', { virtuals: true });

// Indexes for efficient queries
enrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });
enrollmentSchema.index({ schoolId: 1, status: 1 });
enrollmentSchema.index({ studentId: 1, status: 1 });
enrollmentSchema.index({ classId: 1, status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);

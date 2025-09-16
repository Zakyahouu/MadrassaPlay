// server/models/TeacherPayout.js

const mongoose = require('mongoose');

const teacherPayoutSchema = new mongoose.Schema(
  {
    schoolId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'School', 
      required: true 
    },
    teacherId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    classId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Class', 
      required: true 
    },
    year: { 
      type: Number, 
      required: true,
      min: 2020,
      max: 2030
    },
    month: { 
      type: Number, 
      required: true,
      min: 1,
      max: 12
    },
    
    // Financial calculations
    calculatedIncome: { 
      type: Number, 
      required: true,
      min: 0,
      default: 0
    },
    paidAmount: { 
      type: Number, 
      required: true,
      min: 0,
      default: 0
    },
    remainingDebt: { 
      type: Number, 
      required: true,
      default: 0
    },
    
    // Status tracking
    status: { 
      type: String, 
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
      required: true
    },
    
    // Payout history (array of individual payments)
    payoutHistory: [{
      amount: { type: Number, required: true, min: 0 },
      paidAt: { type: Date, default: Date.now },
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      note: { type: String, trim: true },
      method: { type: String, enum: ['cash', 'bank_transfer', 'check'], default: 'cash' }
    }],
    
    // Class-specific data for this payout period
    classData: {
      className: { type: String, required: true },
      totalStudents: { type: Number, default: 0 },
      studentsPaid: { type: Number, default: 0 },
      totalClassIncome: { type: Number, default: 0 },
      teacherCutPercentage: { type: Number, default: 0 },
      teacherCutFixed: { type: Number, default: 0 },
      absenceRule: { type: Boolean, default: false }
    }
  },
  { 
    timestamps: true 
  }
);

// Compound index for efficient queries
teacherPayoutSchema.index({ schoolId: 1, teacherId: 1, year: 1, month: 1 });
teacherPayoutSchema.index({ schoolId: 1, classId: 1, year: 1, month: 1 });
teacherPayoutSchema.index({ schoolId: 1, year: 1, month: 1, status: 1 });

// Virtual for formatted month name
teacherPayoutSchema.virtual('monthName').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[this.month - 1];
});

// Method to calculate remaining debt
teacherPayoutSchema.methods.calculateRemainingDebt = function() {
  this.remainingDebt = Math.max(0, this.calculatedIncome - this.paidAmount);
  return this.remainingDebt;
};

// Method to update status based on payments
teacherPayoutSchema.methods.updateStatus = function() {
  if (this.paidAmount === 0) {
    this.status = 'pending';
  } else if (this.paidAmount >= this.calculatedIncome) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }
  return this.status;
};

// Method to add a payout
teacherPayoutSchema.methods.addPayout = function(amount, paidBy, note = '', method = 'cash') {
  if (amount <= 0) {
    throw new Error('Payout amount must be positive');
  }
  
  if (amount > this.remainingDebt) {
    throw new Error('Payout amount exceeds remaining debt');
  }
  
  this.payoutHistory.push({
    amount,
    paidBy,
    note,
    method,
    paidAt: new Date()
  });
  
  this.paidAmount += amount;
  this.calculateRemainingDebt();
  this.updateStatus();
  
  return this;
};

// Static method to get teacher summary for a month
teacherPayoutSchema.statics.getTeacherSummary = async function(schoolId, teacherId, year, month) {
  const payouts = await this.find({
    schoolId: new mongoose.Types.ObjectId(schoolId),
    teacherId: new mongoose.Types.ObjectId(teacherId),
    year,
    month
  }).populate('classId', 'name');
  
  const summary = {
    teacherId,
    year,
    month,
    totalCalculatedIncome: 0,
    totalPaidAmount: 0,
    totalRemainingDebt: 0,
    status: 'pending',
    classes: []
  };
  
  payouts.forEach(payout => {
    summary.totalCalculatedIncome += payout.calculatedIncome;
    summary.totalPaidAmount += payout.paidAmount;
    summary.totalRemainingDebt += payout.remainingDebt;
    summary.classes.push({
      classId: payout.classId._id,
      className: payout.classData.className,
      calculatedIncome: payout.calculatedIncome,
      paidAmount: payout.paidAmount,
      remainingDebt: payout.remainingDebt,
      status: payout.status
    });
  });
  
  // Determine overall status
  if (summary.totalPaidAmount === 0) {
    summary.status = 'pending';
  } else if (summary.totalPaidAmount >= summary.totalCalculatedIncome) {
    summary.status = 'paid';
  } else {
    summary.status = 'partial';
  }
  
  return summary;
};

module.exports = mongoose.model('TeacherPayout', teacherPayoutSchema);

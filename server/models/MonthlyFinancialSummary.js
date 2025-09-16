// server/models/MonthlyFinancialSummary.js

const mongoose = require('mongoose');

const monthlyFinancialSummarySchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
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

    // Financial totals for this month
    totalIncome: {
      type: Number,
      default: 0,
      min: 0
    },
    totalExpenses: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDebts: {
      type: Number,
      default: 0
    },
    teacherEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    totalStaffSalariesPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    employeeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    teacherCount: {
      type: Number,
      default: 0,
      min: 0
    },
    netBalance: {
      type: Number,
      default: 0
    },

    // Metadata
    lastCalculated: {
      type: Date,
      default: Date.now
    },
    isCalculated: {
      type: Boolean,
      default: false
    },
    isFrozen: {
      type: Boolean,
      default: false
    },
    frozenAt: {
      type: Date,
    },
    frozenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
monthlyFinancialSummarySchema.index({ schoolId: 1, year: 1, month: 1 }, { unique: true });

// Static method to get a frozen summary
monthlyFinancialSummarySchema.statics.getFrozenSummary = function(schoolId, year, month) {
  return this.findOne({ schoolId, year, month, isFrozen: true }).populate('frozenBy', 'firstName lastName');
};

// Virtual for formatted month name
monthlyFinancialSummarySchema.virtual('monthName').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[this.month - 1];
});

// Method to calculate net balance
monthlyFinancialSummarySchema.methods.calculateNetBalance = function() {
  this.netBalance = this.totalIncome - this.totalExpenses - this.teacherEarnings;
  return this.netBalance;
};

module.exports = mongoose.model('MonthlyFinancialSummary', monthlyFinancialSummarySchema);

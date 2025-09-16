// server/models/EmployeeSalaryTransaction.js

const mongoose = require('mongoose');

const employeeSalaryTransactionSchema = new mongoose.Schema(
  {
    schoolId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'School', 
      required: true 
    },
    employeeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Employee', 
      required: true 
    },
    year: { 
      type: Number, 
      required: true 
    },
    month: { 
      type: Number, 
      required: true,
      min: 1,
      max: 12
    },
    calculatedSalary: { 
      type: Number, 
      required: true,
      min: 0
    },
    paidAmount: { 
      type: Number, 
      required: true,
      min: 0
    },
    remaining: { 
      type: Number, 
      required: true,
      min: 0
    },
    paymentMethod: { 
      type: String, 
      required: true,
      trim: true
    },
    transactionDate: { 
      type: Date, 
      required: true 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    notes: { 
      type: String, 
      trim: true 
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient queries
employeeSalaryTransactionSchema.index({ schoolId: 1, employeeId: 1, year: 1, month: 1 });
employeeSalaryTransactionSchema.index({ schoolId: 1, year: 1, month: 1 });
employeeSalaryTransactionSchema.index({ employeeId: 1, year: 1, month: 1 });

// Method to calculate remaining amount
employeeSalaryTransactionSchema.methods.calculateRemaining = function() {
  this.remaining = this.calculatedSalary - this.paidAmount;
  return this.remaining;
};

// Method to check if fully paid
employeeSalaryTransactionSchema.methods.isFullyPaid = function() {
  return this.remaining <= 0;
};

// Method to check if partially paid
employeeSalaryTransactionSchema.methods.isPartiallyPaid = function() {
  return this.paidAmount > 0 && this.remaining > 0;
};

// Static method to get transactions by employee and month
employeeSalaryTransactionSchema.statics.getByEmployeeAndMonth = function(employeeId, year, month) {
  return this.findOne({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    year: year,
    month: month
  }).populate('employeeId', 'name role salaryType salaryValue');
};

// Static method to get all transactions for a school and month
employeeSalaryTransactionSchema.statics.getBySchoolAndMonth = function(schoolId, year, month) {
  return this.find({
    schoolId: new mongoose.Types.ObjectId(schoolId),
    year: year,
    month: month
  }).populate('employeeId', 'name role salaryType salaryValue')
    .populate('createdBy', 'firstName lastName')
    .sort({ transactionDate: -1 });
};

// Static method to get salary summary for a month
employeeSalaryTransactionSchema.statics.getSalarySummary = function(schoolId, year, month) {
  return this.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(schoolId),
        year: year,
        month: month
      }
    },
    {
      $group: {
        _id: null,
        totalCalculated: { $sum: '$calculatedSalary' },
        totalPaid: { $sum: '$paidAmount' },
        totalRemaining: { $sum: '$remaining' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('EmployeeSalaryTransaction', employeeSalaryTransactionSchema);

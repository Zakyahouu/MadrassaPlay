// server/models/ManualTransaction.js

const mongoose = require('mongoose');

const manualTransactionSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    receiptNumber: {
      type: String,
      trim: true,
      sparse: true // Allow multiple null values
    },
    date: {
      type: Date,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
manualTransactionSchema.index({ schoolId: 1, date: 1 });
manualTransactionSchema.index({ schoolId: 1, type: 1, date: 1 });
manualTransactionSchema.index({ schoolId: 1, category: 1, date: 1 });
manualTransactionSchema.index({ schoolId: 1, createdBy: 1 });

// Virtual for formatted date
manualTransactionSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Virtual for formatted amount
manualTransactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.amount);
});

// Static method to get transactions by month
manualTransactionSchema.statics.getByMonth = function(schoolId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  return this.find({
    schoolId: new mongoose.Types.ObjectId(schoolId),
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('createdBy', 'firstName lastName').sort({ date: -1 });
};

// Static method to get monthly totals
manualTransactionSchema.statics.getMonthlyTotals = function(schoolId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(schoolId),
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('ManualTransaction', manualTransactionSchema);

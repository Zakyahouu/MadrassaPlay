const mongoose = require('mongoose');

const studentFinancialSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    debt: { type: Number, default: 0 }, // >0 student owes school; <0 school owes student
  },
  { timestamps: true }
);

studentFinancialSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('StudentFinancial', studentFinancialSchema);



const mongoose = require('mongoose');

const enrollmentHistorySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  action: {
    type: String,
    enum: ['enrolled', 'transferred', 'dropped'],
    required: true
  },
  fromClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  toClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EnrollmentHistory', enrollmentHistorySchema);

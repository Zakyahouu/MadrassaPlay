const mongoose = require('mongoose');

const gradeSystemSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['language', 'academic'],
    required: true
  },
  levels: [{
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GradeSystem', gradeSystemSchema);

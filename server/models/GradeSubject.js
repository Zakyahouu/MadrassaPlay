const mongoose = require('mongoose');

const gradeSubjectSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  gradeLevel: {
    system: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GradeSystem',
      required: true
    },
    level: {
      type: String,
      required: true
    }
  },
  subjects: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    hoursPerWeek: Number
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GradeSubject', gradeSubjectSchema);

const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  group: {
    type: String,
    required: true,
    enum: [
      'student_management',
      'teacher_management',
      'class_management',
      'grade_management',
      'staff_management',
      'reports'
    ]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Permission', permissionSchema);

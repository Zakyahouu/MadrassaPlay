const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teacherSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Teacher name is required.'], 
    trim: true 
  },
  subject: { 
    type: String, 
    required: [true, 'Subject is required.'], 
    trim: true 
  },
  department: { 
    type: String, 
    required: [true, 'Department is required.'] 
  },
  experience: { 
    type: Number, 
    required: [true, 'Experience is required.'], 
    min: 0 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required.'], 
    unique: true, 
    trim: true, 
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  phone: { 
    type: String, 
    required: false, 
    trim: true 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'on_leave', 'retired'], // Only allows these specific values
    default: 'active' 
  },
  rating: { 
    type: Number, 
    min: 0, 
    max: 5, 
    default: 0 
  },
  // This field links the teacher to a school. Assumes you have a 'School' model.
  school: { 
    type: Schema.Types.ObjectId, 
    ref: 'School', 
    required: true 
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;

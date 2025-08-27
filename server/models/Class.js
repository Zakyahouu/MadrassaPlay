// server/models/Class.js

const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [100, 'Class name cannot exceed 100 characters']
  },
  
  // School and Catalog Integration
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  
  // Catalog Item Reference
  catalogItem: {
    type: {
      type: String,
      enum: ['supportLessons', 'reviewCourses', 'vocationalTrainings', 'languages', 'otherActivities'],
      required: [true, 'Catalog item type is required']
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Catalog item ID is required']
    }
  },
  
  // Teacher Assignment
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  
  // Room Assignment
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room is required']
  },
  
  // Schedule
  schedule: {
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: [true, 'Day of week is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      // Enforce zero-padded HH:MM to ensure correct lexicographic ordering
      match: [/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format (00:00 - 23:59)']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format (00:00 - 23:59)']
    }
  },
  
  // Capacity and Enrollment
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  
  // Enrollment Period
  enrollmentPeriod: {
    startDate: {
      type: Date,
      required: [true, 'Enrollment start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Enrollment end date is required']
    }
  },
  
  // Payment and Financial
  paymentCycle: {
    type: Number,
    required: [true, 'Payment cycle (sessions) is required'],
    min: [1, 'Payment cycle must be at least 1 session']
  },
  
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  teacherCut: {
    mode: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Teacher cut mode is required']
    },
    value: {
      type: Number,
      required: [true, 'Teacher cut value is required'],
      min: [0, 'Teacher cut cannot be negative']
    }
  },
  
  // Rules and Settings
  absenceRule: {
    type: Boolean,
    default: false,
    description: 'Whether absence affects payment'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'completed'],
    default: 'active'
  },
  
  // Current Enrollment (reference unified User model with role=student)
  enrolledStudents: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'dropped', 'completed'],
      default: 'active'
    }
  }],
  
  // Session Tracking
  totalSessions: {
    type: Number,
    default: 0
  },
  
  completedSessions: {
    type: Number,
    default: 0
  },
  
  // Metadata
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Virtual for current enrollment count
classSchema.virtual('currentEnrollmentCount').get(function() {
  return this.enrolledStudents.filter(student => student.status === 'active').length;
});

// Virtual for enrollment percentage
classSchema.virtual('enrollmentPercentage').get(function() {
  if (this.capacity === 0) return 0;
  return Math.round((this.currentEnrollmentCount / this.capacity) * 100);
});

// Virtual for progress percentage
classSchema.virtual('progressPercentage').get(function() {
  if (this.totalSessions === 0) return 0;
  return Math.round((this.completedSessions / this.totalSessions) * 100);
});

// Check for scheduling conflicts
classSchema.methods.hasConflict = async function() {
  const Class = mongoose.model('Class');
  
  // Check room conflicts (same school, same room, same day, overlapping time)
  const roomConflict = await Class.findOne({
    _id: { $ne: this._id },
    schoolId: this.schoolId,
    roomId: this.roomId,
    status: { $in: ['active'] },
    'schedule.dayOfWeek': this.schedule.dayOfWeek,
    $or: [
      { 'schedule.startTime': { $lte: this.schedule.startTime }, 'schedule.endTime': { $gt: this.schedule.startTime } },
      { 'schedule.startTime': { $lt: this.schedule.endTime }, 'schedule.endTime': { $gte: this.schedule.endTime } },
      { 'schedule.startTime': { $gte: this.schedule.startTime }, 'schedule.endTime': { $lte: this.schedule.endTime } }
    ]
  });
  
  if (roomConflict) return { type: 'room', conflict: roomConflict };
  
  // Check teacher conflicts (same school, same teacher, same day, overlapping time)
  const teacherConflict = await Class.findOne({
    _id: { $ne: this._id },
    schoolId: this.schoolId,
    teacherId: this.teacherId,
    status: { $in: ['active'] },
    'schedule.dayOfWeek': this.schedule.dayOfWeek,
    $or: [
      { 'schedule.startTime': { $lte: this.schedule.startTime }, 'schedule.endTime': { $gt: this.schedule.startTime } },
      { 'schedule.startTime': { $lt: this.schedule.endTime }, 'schedule.endTime': { $gte: this.schedule.endTime } },
      { 'schedule.startTime': { $gte: this.schedule.startTime }, 'schedule.endTime': { $lte: this.schedule.endTime } }
    ]
  });
  
  if (teacherConflict) return { type: 'teacher', conflict: teacherConflict };
  
  return null;
};

// Ensure virtual fields are serialized
classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

// Helpful indexes for conflict queries
classSchema.index({ schoolId: 1, 'schedule.dayOfWeek': 1, roomId: 1, status: 1 });
classSchema.index({ schoolId: 1, 'schedule.dayOfWeek': 1, teacherId: 1, status: 1 });

module.exports = mongoose.model('Class', classSchema);

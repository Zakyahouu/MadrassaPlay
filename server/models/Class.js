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
  
  // Schedule - Now supports multiple schedules
  schedules: [{
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
  }],
  
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
  // New pricing model (preferred)
  paymentModel: {
    type: String,
    enum: ['per_session', 'per_cycle'],
    required: [true, 'paymentModel is required'],
  },
  sessionPrice: {
    type: Number,
    min: [0, 'sessionPrice cannot be negative'],
    validate: {
      validator: function (v) {
        if (this.paymentModel === 'per_session') return typeof v === 'number';
        return true;
      },
      message: 'sessionPrice is required when paymentModel is per_session',
    },
  },
  cycleSize: {
    type: Number,
    min: [1, 'cycleSize must be >= 1'],
    validate: {
      validator: function (v) {
        if (this.paymentModel === 'per_cycle') return typeof v === 'number';
        return true;
      },
      message: 'cycleSize is required when paymentModel is per_cycle',
    },
  },
  cyclePrice: {
    type: Number,
    min: [0, 'cyclePrice cannot be negative'],
    validate: {
      validator: function (v) {
        if (this.paymentModel === 'per_cycle') return typeof v === 'number';
        return true;
      },
      message: 'cyclePrice is required when paymentModel is per_cycle',
    },
  },
  
  // Legacy fields (kept for migration/backward compatibility)
  paymentCycle: {
    type: Number,
    required: false,
    min: [1, 'Payment cycle must be at least 1 session']
  },
  price: {
    type: Number,
    required: false,
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
  const list = Array.isArray(this.enrolledStudents) ? this.enrolledStudents : [];
  return list.filter(student => student && student.status === 'active').length;
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
  
  // Check each schedule for conflicts
  for (const schedule of this.schedules) {
    // Check room conflicts (same school, same room, same day, overlapping time)
    const roomConflict = await Class.findOne({
      _id: { $ne: this._id },
      schoolId: this.schoolId,
      roomId: this.roomId,
      status: { $in: ['active'] },
      $or: [
        { 'schedules.dayOfWeek': schedule.dayOfWeek, 'schedules.startTime': { $lte: schedule.startTime }, 'schedules.endTime': { $gt: schedule.startTime } },
        { 'schedules.dayOfWeek': schedule.dayOfWeek, 'schedules.startTime': { $lt: schedule.endTime }, 'schedules.endTime': { $gte: schedule.endTime } },
        { 'schedules.dayOfWeek': schedule.dayOfWeek, 'schedules.startTime': { $gte: schedule.startTime }, 'schedules.endTime': { $lte: schedule.endTime } }
      ]
    });
    
    if (roomConflict) return { type: 'room', conflict: roomConflict, schedule };
    
    // Check teacher conflicts (same school, same teacher, same day, overlapping time)
    const teacherConflict = await Class.findOne({
      _id: { $ne: this._id },
      schoolId: this.schoolId,
      teacherId: this.teacherId,
      status: { $in: ['active'] },
      $or: [
        { 'schedules.dayOfWeek': schedule.dayOfWeek, 'schedules.startTime': { $lte: schedule.startTime }, 'schedules.endTime': { $gt: schedule.startTime } },
        { 'schedules.dayOfWeek': schedule.dayOfWeek, 'schedules.startTime': { $lt: schedule.endTime }, 'schedules.endTime': { $gte: schedule.endTime } },
        { 'schedules.dayOfWeek': schedule.dayOfWeek, 'schedules.startTime': { $gte: schedule.startTime }, 'schedules.endTime': { $lte: schedule.endTime } }
      ]
    });
    
    if (teacherConflict) return { type: 'teacher', conflict: teacherConflict, schedule };
  }
  
  return null;
};

// Ensure virtual fields are serialized
classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

// Helpful indexes for conflict queries
classSchema.index({ schoolId: 1, 'schedules.dayOfWeek': 1, roomId: 1, status: 1 });
classSchema.index({ schoolId: 1, 'schedules.dayOfWeek': 1, teacherId: 1, status: 1 });

module.exports = mongoose.model('Class', classSchema);


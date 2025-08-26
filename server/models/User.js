
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // --- Core Fields ---
    name: { type: String, required: false }, // Keep for backward compatibility
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  email: { 
    type: String, 
    required: function() { return this.role !== 'employee'; }, // 'Other' employees can be created without email
    unique: true,
    sparse: true,
  },
  username: { type: String, required: false, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
  enum: ['student', 'teacher', 'admin', 'manager', 'principal', 'staff', 'employee'],
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    // ... other fields

  // Contact and banking (optional, used by manager flows)
    contact: {
      phone1: { type: String, trim: true },
      phone2: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    banking: {
      ccp: { type: String, trim: true },
      bankAccount: { type: String, trim: true },
    },
  // Employee HR fields
  educationLevel: { type: String, trim: true },
  contractType: { type: String, trim: true },
  startDate: { type: Date },
  salary: { type: Number, min: 0 },
  permissions: [{ type: String, trim: true }],

    // --- Teacher Fields ---
    experience: {
      type: Number,
      required: function() { return this.role === 'teacher'; },
      min: 0
    },
    // Teacher employment status (separate from staff)
    teacherStatus: {
      type: String,
      enum: ['employed', 'freelance', 'retired'],
      default: 'employed',
      required: function() { return this.role === 'teacher'; }
    },
    // Staff/Employee status (separate from teachers)
    staffStatus: {
      type: String,
      enum: ['active', 'on_vacation', 'stopped'],
      default: 'active',
    },
  // Teacher activities chosen from SchoolCatalog (per school)
  activities: [{
    type: {
      type: String,
      enum: ['supportLessons', 'reviewCourses', 'vocationalTrainings', 'languages', 'otherActivities'],
      required: true,
    },
    items: [{ type: mongoose.Schema.Types.Mixed }],
  }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
  },

  // --- Gamification Fields ---
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  totalPoints: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook to maintain backward compatibility and hash password
userSchema.pre('save', async function(next) {
  // Maintain backward compatibility with 'name' field
  if (this.firstName && this.lastName && !this.name) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  
  // If name is provided but not firstName/lastName, split it
  if (this.name && (!this.firstName || !this.lastName)) {
    const nameParts = this.name.trim().split(' ');
    if (nameParts.length >= 2) {
      this.firstName = nameParts[0];
      this.lastName = nameParts.slice(1).join(' ');
    } else {
      this.firstName = nameParts[0] || '';
      this.lastName = '';
    }
  }

  // Hash password if modified and not already hashed
  if (!this.isModified('password')) return next();
  if (typeof this.password === 'string' && this.password.startsWith('$2') && this.password.length >= 60) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method for comparing passwords
userSchema.methods.matchPassword = function(entered) {
  return bcrypt.compare(entered, this.password);
};

// Virtual: unified status for API compatibility (teacher -> teacherStatus, staff/employee -> staffStatus)
userSchema.virtual('status').get(function() {
  if (this.role === 'teacher') return this.teacherStatus;
  if (this.role === 'staff' || this.role === 'employee') return this.staffStatus;
  return undefined;
});

module.exports = mongoose.model('User', userSchema);
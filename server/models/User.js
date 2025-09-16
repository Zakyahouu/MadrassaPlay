const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User model: single source of truth for all platform users
// Organized by sections with clear comments for maintainability.
const userSchema = new mongoose.Schema(
  {
    // =============== Core Identity ===============
    // Legacy 'name' kept for backward compatibility with older endpoints
    name: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  email: {
      type: String,
      // Employees/staff can be created without email; others require it
      required: function () {
        // Email is optional for students, staff, employees, and legacy 'staff pedagogique'
        return this.role !== 'employee' && this.role !== 'staff' && this.role !== 'student' && this.role !== 'staff pedagogique';
      },
      unique: true,
      sparse: true, // allow multiple docs without email
      trim: true,
      lowercase: true,
    },
    username: { type: String, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['student', 'teacher', 'admin', 'manager', 'principal', 'staff', 'employee', 'staff pedagogique'],
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },

    // =============== Contact & Banking (optional) ===============
    contact: {
      phone1: { type: String, trim: true },
      phone2: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    banking: {
      ccp: { type: String, trim: true },
      bankAccount: { type: String, trim: true },
    },

    // =============== Employee/Staff HR Fields ===============
    // Student education level (optional), used to validate class enrollment for level-based classes
    educationLevel: { 
      type: String, 
      trim: true,
      enum: {
        values: ['before_education', 'primary', 'middle', 'high_school', 'university', 'universitie', 'other'],
        message: 'Invalid education level'
      },
    },
    contractType: { type: String, trim: true },
    startDate: { type: Date },
    salary: { type: Number, min: 0 },
    permissions: [{ type: String, trim: true }],

    // =============== Teacher Fields ===============
    experience: {
      type: Number,
      required: function () {
        return this.role === 'teacher';
      },
      min: 0,
    },
    teacherStatus: {
      // Employment status for teachers
      type: String,
      enum: ['employed', 'freelance', 'retired'],
      default: 'employed',
      required: function () {
        return this.role === 'teacher';
      },
    },
    // Teacher activities chosen from SchoolCatalog (per school)
    activities: [
      {
        type: {
          type: String,
          enum: ['supportLessons', 'reviewCourses', 'vocationalTrainings', 'languages', 'otherActivities'],
          required: true,
        },
        items: [{ type: mongoose.Schema.Types.Mixed }],
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    // =============== Staff/Employee Fields ===============
    staffStatus: {
      type: String,
      enum: ['active', 'on_vacation', 'stopped'],
      default: 'active',
    },

    // =============== Student Fields (migrated from Student.js) ===============
    // Dedicated student status separate from staff/teacher statuses
    studentStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      required: function () {
        return this.role === 'student';
      },
    },
    studentCode: {
      type: String,
      // uniqueness is enforced via a compound index (school + studentCode)
      uppercase: true,
      trim: true,
      sparse: true,
      // Auto-generated if missing for students (see pre-validate)
    },
    enrollmentCount: { type: Number, default: 0 },
    balance: {
      type: Number,
      default: 0,
      description: 'Number of remaining sessions',
    },
    enrollmentStatus: {
      type: String,
      enum: ['enrolled', 'not_enrolled'],
      default: 'not_enrolled',
    },

    // =============== Gamification ===============
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    totalPoints: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// -------- Virtuals --------
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Unified status (compatibility):
// - teacher -> teacherStatus
// - staff/employee -> staffStatus
// - student -> studentStatus
userSchema.virtual('status').get(function () {
  if (this.role === 'teacher') return this.teacherStatus;
  if (this.role === 'staff' || this.role === 'employee' || this.role === 'staff pedagogique') return this.staffStatus;
  if (this.role === 'student') return this.studentStatus;
  return undefined;
});

// -------- Static methods --------
userSchema.statics.generateStudentCode = function () {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `STU${timestamp}${random}`;
};

// -------- Hooks --------
// Pre-validate: ensure studentCode exists only for students
userSchema.pre('validate', function (next) {
  if (this.role === 'student') {
    if (!this.studentCode) {
      this.studentCode = this.constructor.generateStudentCode();
    }
  } else {
    // Remove the field entirely so it doesn't appear as null
    if (this.studentCode !== undefined) {
      try { delete this.studentCode; } catch (_) { this.studentCode = undefined; }
    }
  }
  next();
});

// Pre-save: maintain legacy 'name' behavior and hash password
userSchema.pre('save', async function (next) {
  // Safety: ensure non-students never persist a studentCode value
  if (this.role !== 'student' && this.studentCode !== undefined) {
    try { delete this.studentCode; } catch (_) { this.studentCode = undefined; }
  }
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
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Ensure unique studentCode per school (tenant) ONLY for students with a string code
userSchema.index(
  { school: 1, studentCode: 1 },
  { unique: true, partialFilterExpression: { role: 'student', studentCode: { $type: 'string' } } }
);

module.exports = mongoose.model('User', userSchema);
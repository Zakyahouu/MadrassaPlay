
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // --- Core Fields ---
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['student', 'teacher', 'admin', 'manager', 'principal','staff pedagogique', 'staff '], // Add more roles as needed
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    // ... other fields

    // --- NEW: Teacher-Specific Fields ---
    // These fields will only be populated for users with role: 'teacher'
    subject: {
      type: String,
      required: function() { return this.role === 'teacher'; } // Required only if the user is a teacher
    },
    department: {
      type: String,
      required: function() { return this.role === 'teacher'; }
    },
    experience: {
      type: Number,
      required: function() { return this.role === 'teacher'; },
      min: 0
    },
    phone: {
      type: String,
      required: false // Optional field
    },
    status: {
        type: String,
        enum: ['active', 'on_leave', 'retired'],
        default: 'active',
        required: function() { return this.role === 'teacher'; }
    },
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
  }
);

// Pre-save hook to hash password if modified and not already hashed
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  // If password already appears hashed (60 chars bcrypt), skip
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

module.exports = mongoose.model('User', userSchema);
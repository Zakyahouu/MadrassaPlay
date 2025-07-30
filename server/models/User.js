// server/models/User.js

// 1. IMPORT MONGOOSE
// ==============================================================================
const mongoose = require('mongoose');

// 2. CREATE THE USER SCHEMA
// ==============================================================================
// This is the blueprint for our User documents.
const userSchema = new mongoose.Schema(
  {
    // --- Core Fields (for all users) ---
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['student', 'teacher', 'admin', 'manager', 'principal'],
      default: 'student',
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    accessLevel: {
      type: String,
      enum: ['principal', 'staff'],
      required: function() {
        return this.role === 'manager';
      }
    },

    // --- Student-Specific Fields ---
    // These fields will only be populated and used if the user's role is 'student'.
    // For teachers and admins, they will simply be empty or null in the database.
    level: {
      type: Number,
      default: 1, // Students start at level 1
    },
    xp: {
      type: Number,
      default: 0, // Students start with 0 experience points
    },
    badges: [
      {
        type: String, // We will store the badge IDs as strings
      },
    ],
    
    // --- Teacher-Specific Fields ---
    // We can add fields just for teachers here in the future if needed.
    // For example:
    // subjectTaught: {
    //   type: String
    // }

  },
  {
    timestamps: true,
  }
);

// 3. CREATE AND EXPORT THE USER MODEL
// ==============================================================================
module.exports = mongoose.model('User', userSchema);

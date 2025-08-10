
const mongoose = require('mongoose');

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
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
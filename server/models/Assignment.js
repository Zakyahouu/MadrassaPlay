// server/models/Assignment.js

const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    // The teacher who created this assignment
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // The list of students this assignment is for.
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    // Optional: one or more classes this assignment targets
    classes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    }],
    // The list of game creations included in this assignment.
    gameCreations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameCreation',
    }],
    // The title of the assignment (e.g., "Chapter 5 Homework")
    title: {
      type: String,
      required: true,
    },
    // The date the assignment becomes available to students
    startDate: {
      type: Date,
      required: true,
    },
    // The date the assignment is due and becomes unavailable
    endDate: {
      type: Date,
      required: true,
    },
    // Maximum number of attempts a student can make
    attemptLimit: {
        type: Number,
        default: 1,
        min: 1,
    },
    // The status of the assignment
    status: {
        type: String,
        enum: ['upcoming', 'active', 'closed'],
        default: 'upcoming',
    }
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up student & class membership queries
assignmentSchema.index({ students: 1 });
assignmentSchema.index({ classes: 1 });
assignmentSchema.index({ teacher: 1, createdAt: -1 });

// Basic automation of status based on start/end dates
function computeStatus(start, end) {
  const now = new Date();
  if (now < new Date(start)) return 'upcoming';
  if (now > new Date(end)) return 'closed';
  return 'active';
}

assignmentSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    this.status = computeStatus(this.startDate, this.endDate);
  }
  next();
});

module.exports = mongoose.model('Assignment', assignmentSchema);

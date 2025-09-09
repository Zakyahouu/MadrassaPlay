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
    // Optional teacher-provided instructions/description for students
    description: {
      type: String,
      default: ''
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
    enum: ['upcoming', 'active', 'canceled', 'completed'],
    default: 'upcoming',
  },
  // Cancellation metadata
  canceledAt: { type: Date },
  // Completion metadata
  completedAt: { type: Date },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
  if (now > new Date(end)) return 'completed';
  return 'active';
}

assignmentSchema.pre('save', function(next) {
  // Do not override manual statuses
  if (this.startDate && this.endDate && this.status !== 'canceled' && this.status !== 'completed') {
    this.status = computeStatus(this.startDate, this.endDate);
  }
  next();
});

// Keep status consistent on updates that don't go through save() (e.g., findOneAndUpdate)
assignmentSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.status !== 'canceled' && this.status !== 'completed') {
    this.status = computeStatus(this.startDate, this.endDate);
  }
  next();
});

// Helpful index if we later want scheduled jobs based on endDate
assignmentSchema.index({ endDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);

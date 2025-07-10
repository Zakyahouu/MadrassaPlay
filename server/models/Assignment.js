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

module.exports = mongoose.model('Assignment', assignmentSchema);

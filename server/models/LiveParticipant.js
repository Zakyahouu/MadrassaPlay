const mongoose = require('mongoose');

const liveParticipantSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession', index: true, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  finishedAt: { type: Date },
  lastPingAt: { type: Date, default: Date.now },
  score: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 },
  rawTimeMs: { type: Number, default: 0 },
  effectiveTimeMs: { type: Number, default: 0 },
}, { timestamps: true });

liveParticipantSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('LiveParticipant', liveParticipantSchema);

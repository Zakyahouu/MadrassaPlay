const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameCreationId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameCreation', required: true },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  title: { type: String, trim: true },
  status: { type: String, enum: ['lobby', 'running', 'ended'], default: 'lobby' },
  allowLateJoin: { type: Boolean, default: true },
  config: {
    scoring: { type: String, enum: ['best', 'fastest', 'hybrid'], default: 'hybrid' },
  timePenaltyPerWrongMs: { type: Number, default: 3000 },
    strictProgress: { type: Boolean, default: false },
  },
  startedAt: { type: Date },
  endedAt: { type: Date },
}, { timestamps: true });

liveSessionSchema.index({ teacherId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);

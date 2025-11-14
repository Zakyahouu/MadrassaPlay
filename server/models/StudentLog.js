const mongoose = require('mongoose');

const studentLogSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    action: {
      type: String,
      enum: ['transfer', 'unenroll', 'suspend', 'unsuspend', 'note', 'enroll'],
      required: true,
    },
    summary: { type: String, required: true, trim: true },
    details: { type: mongoose.Schema.Types.Mixed },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, trim: true },
    actorRole: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

studentLogSchema.index({ schoolId: 1, studentId: 1, createdAt: -1 });
studentLogSchema.index({ schoolId: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('StudentLog', studentLogSchema);

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, enum: ['teacher','manager','admin'], required: true },
  message: { type: String, required: true, trim: true },
  pinned: { type: Boolean, default: false },
  attachments: [{ type: String }],
}, {
  timestamps: true
});

announcementSchema.index({ schoolId: 1, classId: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);

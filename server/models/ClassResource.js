// server/models/ClassResource.js

const mongoose = require('mongoose');

const classResourceSchema = new mongoose.Schema(
  {
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  allowedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    title: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true }, // stored filename on disk
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true }, // public URL under /uploads
  },
  { timestamps: true }
);

classResourceSchema.index({ teacherId: 1, createdAt: -1 });
classResourceSchema.index({ allowedClasses: 1, createdAt: -1 });

module.exports = mongoose.model('ClassResource', classResourceSchema);

const mongoose = require('mongoose');

const schoolDocumentSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Document name cannot exceed 100 characters']
  },
  
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  
  filename: {
    type: String,
    required: true,
    unique: true
  },
  
  filePath: {
    type: String,
    required: true
  },
  
  fileSize: {
    type: Number,
    required: true,
    max: [10485760, 'File size cannot exceed 10MB'] // 10MB in bytes
  },
  
  mimeType: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return v === 'application/pdf';
      },
      message: 'Only PDF files are allowed'
    }
  },
  
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for school + name uniqueness
schoolDocumentSchema.index({ school: 1, name: 1 }, { unique: true });

// Index for efficient school-based queries
schoolDocumentSchema.index({ school: 1, uploadedAt: -1 });

// Middleware to update lastModified on save
schoolDocumentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModified = new Date();
  }
  next();
});

// Virtual for file URL (if needed for serving files)
schoolDocumentSchema.virtual('fileUrl').get(function() {
  return `/api/school-documents/${this._id}/download`;
});

// Ensure virtual fields are serialized
schoolDocumentSchema.set('toJSON', { virtuals: true });
schoolDocumentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SchoolDocument', schoolDocumentSchema);

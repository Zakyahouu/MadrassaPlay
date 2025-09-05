const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directories exist
const schoolDocsDir = path.join(__dirname, '../uploads/school-documents');
const adBannersDir = path.join(__dirname, '../public/uploads/ads');
for (const dir of [schoolDocsDir, adBannersDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Route controls target dir via req.uploadTarget set in route middleware
    const target = req.uploadTarget === 'ads' ? adBannersDir : schoolDocsDir;
    cb(null, target);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const rawSchool = req.user?.school;
    const schoolIdStr = typeof rawSchool === 'string'
      ? rawSchool
      : (rawSchool && rawSchool._id ? String(rawSchool._id) : 'unknown');
    const safeSchoolId = schoolIdStr.replace(/[^a-zA-Z0-9_-]/g, '');

    // Ensure filename is clean and preserve extension
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedOriginalName = `${base}${ext}`;
    const uniqueFilename = `${timestamp}-${safeSchoolId}-${sanitizedOriginalName}`;
    cb(null, uniqueFilename);
  }
});

// File filter configurable per target
const fileFilter = (req, file, cb) => {
  if (req.uploadTarget === 'ads') {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Only JPG, PNG, or WEBP images are allowed'), false);
  }
  // Default to PDFs for school documents
  if (file.mimetype === 'application/pdf') return cb(null, true);
  return cb(new Error('Only PDF files are allowed'), false);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB in bytes
    files: 1 // Only one file at a time
  }
});

// Error handler for multer errors
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
  }
  
  if (error.message === 'Only PDF files are allowed' || error.message?.includes('Only JPG')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

module.exports = {
  upload,
  handleMulterError
};

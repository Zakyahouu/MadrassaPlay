// server/controllers/classResourceController.js

const path = require('path');
const fs = require('fs-extra');
const Class = require('../models/Class');
const ClassResource = require('../models/ClassResource');

// Limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
  'text/plain', 'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
]);
const PER_TEACHER_TOTAL_LIMIT = 20; // total files per teacher

function ensureTeacherOwnsClassOrStudent(req, klass) {
  const isTeacher = req.user.role === 'teacher';
  const isOwner = klass.teacherId?.toString() === req.user._id.toString();
  const isElevated = req.user.role === 'admin' || req.user.role === 'manager';
  if (isTeacher) return isOwner;
  return isElevated; // managers/admin allowed
}

// Optional AV scan hook (stub)
async function scanUploadBufferIfEnabled(file) {
  if (!process.env.SCAN_UPLOADS || process.env.SCAN_UPLOADS !== 'true') return { ok: true };
  try {
    // Placeholder: integrate AV scanner here (e.g., clamav) and return { ok: boolean, message?: string }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: 'Antivirus scan failed' };
  }
}

// GET /api/classes/me/resources (teacher only)
module.exports.listResourcesForTeacher = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Not authorized.' });
    const items = await ClassResource.find({ teacherId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// GET /api/classes/:classId/resources (teacher owner/admin/manager or enrolled students)
module.exports.listResourcesForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const klass = await Class.findById(classId).select('teacherId enrolledStudents');
    if (!klass) return res.status(404).json({ message: 'Class not found.' });
    const isOwner = req.user.role === 'teacher' && klass.teacherId?.toString() === req.user._id.toString();
    const isElevated = req.user.role === 'admin' || req.user.role === 'manager';
    const isStudent = (klass.enrolledStudents || []).some(e => e.studentId?.toString() === req.user._id.toString());
    if (!(isOwner || isElevated || isStudent)) return res.status(403).json({ message: 'Not authorized.' });
    const items = await ClassResource.find({ allowedClasses: classId }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Helper: validate quotas (teacher total only)
async function validateTeacherQuota(teacherId) {
  const totalByTeacher = await ClassResource.countDocuments({ teacherId });
  if (totalByTeacher >= PER_TEACHER_TOTAL_LIMIT) {
    return { ok: false, message: `Upload limit reached: ${PER_TEACHER_TOTAL_LIMIT} files per teacher.` };
  }
  return { ok: true };
}

// POST /api/classes/me/resources
module.exports.uploadTeacherResource = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Only teachers can upload resources.' });
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded.' });
    if (file.size > MAX_FILE_SIZE) return res.status(400).json({ message: 'File too large (max 5MB).' });
    if (!ALLOWED_MIME.has(file.mimetype)) return res.status(400).json({ message: 'File type not allowed.' });

    const quota = await validateTeacherQuota(req.user._id);
    if (!quota.ok) return res.status(400).json({ message: quota.message });

    // Parse allowed classes and restrict to teacher-owned classes
    let allowed = [];
    if (req.body?.allowedClasses) {
      try {
        allowed = Array.isArray(req.body.allowedClasses)
          ? req.body.allowedClasses
          : JSON.parse(req.body.allowedClasses);
      } catch (_) { allowed = []; }
    }
    if (allowed.length) {
      const ownClasses = await Class.find({ _id: { $in: allowed }, teacherId: req.user._id }).select('_id').lean();
      allowed = ownClasses.map(c => c._id);
    }

    const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'teacher-resources', String(req.user._id));
    await fs.ensureDir(uploadsRoot);
    const safeBase = path.basename(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeBase}`;
    const destPath = path.join(uploadsRoot, uniqueName);

    const scan = await scanUploadBufferIfEnabled(file);
    if (!scan.ok) return res.status(400).json({ message: scan.message || 'File failed antivirus scan.' });
    await fs.writeFile(destPath, file.buffer);

    const url = `/uploads/teacher-resources/${req.user._id}/${uniqueName}`;
    const resource = await ClassResource.create({
      teacherId: req.user._id,
      allowedClasses: allowed,
      title: req.body?.title || safeBase,
      description: req.body?.description || '',
      originalName: safeBase,
      fileName: uniqueName,
      mimeType: file.mimetype,
      size: file.size,
      url,
    });
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// PUT /api/classes/me/resources/:resId
module.exports.updateTeacherResource = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Not authorized.' });
    const { resId } = req.params;
    const resource = await ClassResource.findOne({ _id: resId, teacherId: req.user._id });
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });

    const updates = {};
    if (typeof req.body?.title === 'string') updates.title = req.body.title;
    if (typeof req.body?.description === 'string') updates.description = req.body.description;
    if (typeof req.body?.allowedClasses !== 'undefined') {
      let allowed = [];
      try {
        allowed = Array.isArray(req.body.allowedClasses)
          ? req.body.allowedClasses
          : JSON.parse(req.body.allowedClasses);
      } catch (_) { allowed = []; }
      if (allowed.length) {
        const ownClasses = await Class.find({ _id: { $in: allowed }, teacherId: req.user._id }).select('_id').lean();
        updates.allowedClasses = ownClasses.map(c => c._id);
      } else {
        updates.allowedClasses = [];
      }
    }

    if (req.file) {
      const file = req.file;
      if (file.size > MAX_FILE_SIZE) return res.status(400).json({ message: 'File too large (max 5MB).' });
      if (!ALLOWED_MIME.has(file.mimetype)) return res.status(400).json({ message: 'File type not allowed.' });
      const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'teacher-resources', String(req.user._id));
      await fs.ensureDir(uploadsRoot);
      const safeBase = path.basename(file.originalname);
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeBase}`;
      const destPath = path.join(uploadsRoot, uniqueName);
      const scan = await scanUploadBufferIfEnabled(file);
      if (!scan.ok) return res.status(400).json({ message: scan.message || 'File failed antivirus scan.' });
      await fs.writeFile(destPath, file.buffer);
      // Delete old file best-effort
      if (resource.fileName) {
        const oldPath = path.join(uploadsRoot, resource.fileName);
        fs.unlink(oldPath).catch(() => {});
      }
      updates.originalName = safeBase;
      updates.fileName = uniqueName;
      updates.mimeType = file.mimetype;
      updates.size = file.size;
      updates.url = `/uploads/teacher-resources/${req.user._id}/${uniqueName}`;
    }

    Object.assign(resource, updates);
    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// DELETE /api/classes/me/resources/:resId
module.exports.deleteTeacherResource = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Not authorized.' });
    const { resId } = req.params;
    const resource = await ClassResource.findOne({ _id: resId, teacherId: req.user._id });
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });
    // Delete file
    const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'teacher-resources', String(req.user._id));
    const filePath = path.join(uploadsRoot, resource.fileName);
    fs.unlink(filePath).catch(() => {});
    await resource.deleteOne();
    res.json({ message: 'Resource deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// GET /api/classes/:classId/resources/:resId/download
module.exports.downloadResource = async (req, res) => {
  try {
    const { classId, resId } = req.params;
  const resource = await ClassResource.findOne({ _id: resId, allowedClasses: classId });
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });
    const klass = await Class.findById(classId).select('teacherId enrolledStudents');
    if (!klass) return res.status(404).json({ message: 'Class not found.' });
  // Auth: teacher owner of class, elevated roles, or enrolled students
  const isTeacher = req.user.role === 'teacher' && klass.teacherId?.toString() === req.user._id.toString();
    const isElevated = req.user.role === 'admin' || req.user.role === 'manager';
    const isStudent = (klass.enrolledStudents || []).some(e => e.studentId?.toString() === req.user._id.toString());
    if (!(isTeacher || isElevated || isStudent)) return res.status(403).json({ message: 'Not authorized.' });

  const filePath = path.join(__dirname, '..', 'public', 'uploads', 'teacher-resources', String(resource.teacherId), resource.fileName);
    // Add simple caching headers (ETag/Last-Modified)
    try {
      const stat = await fs.stat(filePath);
      const lastModified = stat.mtime.toUTCString();
      const etag = `W/"${stat.size}-${stat.mtimeMs}"`;
      res.setHeader('ETag', etag);
      res.setHeader('Last-Modified', lastModified);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      if (req.headers['if-none-match'] === etag || req.headers['if-modified-since'] === lastModified) {
        return res.status(304).end();
      }
    } catch (_) { /* ignore */ }

    return res.download(filePath, resource.originalName);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

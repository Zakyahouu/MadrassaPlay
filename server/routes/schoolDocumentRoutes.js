const express = require('express');
const router = express.Router();
const {
  getSchoolDocuments,
  uploadDocument,
  updateDocumentName,
  deleteDocument,
  downloadDocument
} = require('../controllers/schoolDocumentController');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require admin authentication
router.use(protect);
router.use(admin);

// GET /api/school-documents/:schoolId - Get all documents for a school
router.get('/:schoolId', getSchoolDocuments);

// POST /api/school-documents/:schoolId - Upload a new document
router.post('/:schoolId', 
  upload.single('document'), 
  handleMulterError, 
  uploadDocument
);

// PUT /api/school-documents/name/:documentId - Update document name
router.put('/name/:documentId', updateDocumentName);

// DELETE /api/school-documents/:documentId - Delete a document
router.delete('/:documentId', deleteDocument);

// GET /api/school-documents/download/:documentId - Download a document
router.get('/download/:documentId', downloadDocument);

module.exports = router;

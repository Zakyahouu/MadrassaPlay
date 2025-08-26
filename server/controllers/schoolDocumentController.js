const SchoolDocument = require('../models/SchoolDocument');
const School = require('../models/School');
const fs = require('fs').promises;
const path = require('path');

// Get all documents for a specific school
const getSchoolDocuments = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Verify school exists and user has admin access
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        message: 'School not found' 
      });
    }
    
    const documents = await SchoolDocument.find({ school: schoolId })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ uploadedAt: -1 });
    
    res.json({
      success: true,
      data: documents,
      count: documents.length,
      maxAllowed: 5
    });
  } catch (error) {
    console.error('Error fetching school documents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching documents' 
    });
  }
};

// Upload a new document
const uploadDocument = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document name is required' 
      });
    }
    
    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(404).json({ 
        success: false, 
        message: 'School not found' 
      });
    }
    
    // Check document limit (5 per school)
    const existingCount = await SchoolDocument.countDocuments({ school: schoolId });
    if (existingCount >= 5) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum 5 documents allowed per school' 
      });
    }
    
    // Check for duplicate name within the school
    const existingDoc = await SchoolDocument.findOne({ 
      school: schoolId, 
      name: name.trim() 
    });
    if (existingDoc) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'A document with this name already exists for this school' 
      });
    }
    
    // Create document record
    const document = new SchoolDocument({
      school: schoolId,
      name: name.trim(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id
    });
    
    await document.save();
    
    // Populate user info for response
    await document.populate('uploadedBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file after upload failure:', unlinkError);
      }
    }
    
    console.error('Error uploading document:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'A document with this name already exists for this school' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while uploading document' 
    });
  }
};

// Update document name
const updateDocumentName = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document name is required' 
      });
    }
    
    const document = await SchoolDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Check for duplicate name within the same school
    const existingDoc = await SchoolDocument.findOne({ 
      school: document.school, 
      name: name.trim(),
      _id: { $ne: documentId }
    });
    
    if (existingDoc) {
      return res.status(400).json({ 
        success: false, 
        message: 'A document with this name already exists for this school' 
      });
    }
    
    document.name = name.trim();
    await document.save();
    
    await document.populate('uploadedBy', 'firstName lastName email');
    
    res.json({
      success: true,
      message: 'Document name updated successfully',
      data: document
    });
  } catch (error) {
    console.error('Error updating document name:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'A document with this name already exists for this school' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating document name' 
    });
  }
};

// Delete a document
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const document = await SchoolDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Delete the physical file
    try {
      await fs.unlink(document.filePath);
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Continue with database deletion even if file deletion fails
    }
    
    // Delete the database record
    await SchoolDocument.findByIdAndDelete(documentId);
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting document' 
    });
  }
};

// Download a document
const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const document = await SchoolDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (error) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found on server' 
      });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    
    // Send file
    res.sendFile(path.resolve(document.filePath));
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while downloading document' 
    });
  }
};

module.exports = {
  getSchoolDocuments,
  uploadDocument,
  updateDocumentName,
  deleteDocument,
  downloadDocument
};

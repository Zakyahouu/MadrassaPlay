# School Document Upload System - API Documentation

## Overview
This system allows admins to upload, manage, and organize PDF documents for schools. Each school can have up to 5 documents with customizable names.

## Features Implemented
✅ **Admin-only access** - Only admin users can manage documents  
✅ **5 documents per school limit** - Enforced at the API level  
✅ **PDF only uploads** - File type validation  
✅ **10MB file size limit** - Storage optimization  
✅ **Document name editing** - Rename documents after upload  
✅ **Secure file storage** - Files stored outside web root  
✅ **Download functionality** - Secure file serving  
✅ **Duplicate name prevention** - Per-school name uniqueness  

## API Endpoints

### 1. Get School Documents
```
GET /api/school-documents/:schoolId
```
**Headers:** `Authorization: Bearer <admin_token>`  
**Response:** List of documents for the specified school

### 2. Upload Document
```
POST /api/school-documents/:schoolId
```
**Headers:** `Authorization: Bearer <admin_token>`  
**Content-Type:** `multipart/form-data`  
**Body:**
- `document` (file): PDF file to upload
- `name` (string): Custom name for the document

**Validation:**
- Only PDF files accepted
- Maximum 10MB file size
- Maximum 5 documents per school
- Unique document names per school

### 3. Update Document Name
```
PUT /api/school-documents/name/:documentId
```
**Headers:** `Authorization: Bearer <admin_token>`  
**Body:**
```json
{
  "name": "New Document Name"
}
```

### 4. Delete Document
```
DELETE /api/school-documents/:documentId
```
**Headers:** `Authorization: Bearer <admin_token>`  
**Effect:** Removes both database record and physical file

### 5. Download Document
```
GET /api/school-documents/download/:documentId
```
**Headers:** `Authorization: Bearer <admin_token>`  
**Response:** PDF file download

## Database Schema

### SchoolDocument Model
```javascript
{
  school: ObjectId,           // Reference to School
  name: String,              // Custom document name (editable)
  originalName: String,      // Original filename
  filename: String,          // Unique stored filename
  filePath: String,          // Physical file path
  fileSize: Number,          // File size in bytes
  mimeType: String,          // Must be 'application/pdf'
  uploadedBy: ObjectId,      // Admin who uploaded
  uploadedAt: Date,          // Upload timestamp
  lastModified: Date         // Last modification timestamp
}
```

## File Storage Structure
```
server/
├── uploads/
│   └── school-documents/
│       ├── 1672531200000-64a1b2c3d4e5f6-document1.pdf
│       ├── 1672531300000-64a1b2c3d4e5f6-document2.pdf
│       └── ...
└── ...
```

## Security Features
- **Admin-only access** - All endpoints require admin authentication
- **File type validation** - Only PDF files accepted
- **Size limits** - 10MB maximum per file
- **Unique filenames** - Timestamp + schoolId + sanitized original name
- **Path sanitization** - Prevents directory traversal attacks
- **Error handling** - Graceful cleanup on failures

## Example Usage with JavaScript (Frontend)

### Upload Document
```javascript
const uploadDocument = async (schoolId, file, name, token) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('name', name);
  
  const response = await fetch(`/api/school-documents/${schoolId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};
```

### Get School Documents
```javascript
const getSchoolDocuments = async (schoolId, token) => {
  const response = await fetch(`/api/school-documents/${schoolId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

### Update Document Name
```javascript
const updateDocumentName = async (documentId, newName, token) => {
  const response = await fetch(`/api/school-documents/name/${documentId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: newName })
  });
  
  return response.json();
};
```

## Error Handling
The API returns standardized error responses:

```javascript
// Success response
{
  "success": true,
  "data": { /* document object */ },
  "message": "Document uploaded successfully"
}

// Error response
{
  "success": false,
  "message": "Maximum 5 documents allowed per school"
}
```

## Integration Notes
- All routes are prefixed with `/api/school-documents`
- Requires existing authentication system (admin role)
- Uses multer for file upload handling
- Files are stored in `server/uploads/school-documents/`
- Uploads directory is ignored by git (.gitignore entry added)

## Testing Checklist
- [ ] Upload PDF document for a school
- [ ] Verify 5-document limit enforcement
- [ ] Test duplicate name prevention
- [ ] Edit document name
- [ ] Download document
- [ ] Delete document
- [ ] Test file type validation (non-PDF rejection)
- [ ] Test file size limit (>10MB rejection)
- [ ] Verify admin-only access (non-admin rejection)

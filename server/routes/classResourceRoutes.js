// server/routes/classResourceRoutes.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { protect } = require('../middleware/authMiddleware');
const { listResourcesForTeacher, listResourcesForClass, uploadTeacherResource, updateTeacherResource, deleteTeacherResource, downloadResource } = require('../controllers/classResourceController');

router.use(protect);

// Teacher scoped: list own resources
router.get('/me/resources', listResourcesForTeacher);
// Teacher scoped: upload a new resource and assign allowed classes
router.post('/me/resources', upload.single('file'), uploadTeacherResource);
// Teacher scoped: update metadata/replace file/change allowed classes
router.put('/me/resources/:resId', upload.single('file'), updateTeacherResource);
// Teacher scoped: delete
router.delete('/me/resources/:resId', deleteTeacherResource);

// Class-scoped: list resources visible to that class (for teacher/admin/manager or enrolled students)
router.get('/:classId/resources', listResourcesForClass);
// Download (visible to teacher/admin/manager of that school or enrolled students with access)
router.get('/:classId/resources/:resId/download', downloadResource);

module.exports = router;

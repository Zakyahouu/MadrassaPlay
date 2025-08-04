// server/routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { getTeachersForSchool } = require('../controllers/teacherController');
const { protect, manager } = require('../middleware/authMiddleware');

router.get('/', protect, manager, getTeachersForSchool);

module.exports = router;

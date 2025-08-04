const express = require('express');
const router = express.Router();
const { getStudentsForSchool } = require('../controllers/studentController');
const { protect, manager, admin } = require('../middleware/authMiddleware');

// GET all students for the manager's school
router.get('/', protect, manager, getStudentsForSchool);

module.exports = router;

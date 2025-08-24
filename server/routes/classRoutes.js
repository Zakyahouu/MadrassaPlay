// server/routes/classRoutes.js

const express = require('express');
const router = express.Router();

const { createClass, getClasses, updateClass, deleteClass, getMyClasses, getMyTeachingClasses } = require('../controllers/classController');
const { protect, admin, manager, staff, teacher } = require('../middleware/authMiddleware');

// Student: get my classes
router.get('/my', protect, getMyClasses);

// Teacher: get classes I teach
router.get('/teaching', protect, teacher, getMyTeachingClasses);

// Create a new class
router.post('/', protect, manager, createClass);

// Get all classes for a school
router.get('/', protect, manager, getClasses);

// Update a class
router.put('/:id', protect, manager, updateClass);

// Delete a class
router.delete('/:id', protect, manager, deleteClass);

module.exports = router;

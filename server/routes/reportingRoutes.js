const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { assignmentSummary, classPerformance } = require('../controllers/reportingController');

router.get('/assignments/:assignmentId/summary', protect, assignmentSummary);
router.get('/classes/:classId/performance', protect, classPerformance);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, teacher, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/liveSessionController');

router.post('/', protect, teacher, ctrl.createSession);
router.get('/', protect, teacher, ctrl.listSessions);
router.get('/:id', protect, authorize('teacher','admin','manager'), ctrl.getDetails);
router.get('/:id/summary', protect, authorize('teacher','admin','manager'), ctrl.getSummary);
router.post('/:id/end', protect, authorize('teacher','admin','manager'), ctrl.endSession);
router.delete('/:id', protect, authorize('teacher','admin','manager'), ctrl.deleteSession);

module.exports = router;

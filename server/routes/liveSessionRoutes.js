const express = require('express');
const router = express.Router();
const { protect, teacher } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/liveSessionController');

router.post('/', protect, teacher, ctrl.createSession);
router.get('/', protect, teacher, ctrl.listSessions);
router.get('/:id', protect, teacher, ctrl.getDetails);
router.get('/:id/summary', protect, teacher, ctrl.getSummary);
router.post('/:id/end', protect, teacher, ctrl.endSession);
router.delete('/:id', protect, teacher, ctrl.deleteSession);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const ctrl = require('../controllers/roomController');

router.use(protect);

router.get('/', authorize('manager', 'staff', 'employee', 'staff pedagogique', 'teacher'), checkPermission('rooms'), ctrl.listRooms);
router.post('/', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('rooms'), ctrl.createRoom);

router.get('/:id', authorize('manager', 'staff', 'employee', 'staff pedagogique', 'teacher'), checkPermission('rooms'), ctrl.getRoom);
router.put('/:id', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('rooms'), ctrl.updateRoom);
router.delete('/:id', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('rooms'), ctrl.deleteRoom);

module.exports = router;

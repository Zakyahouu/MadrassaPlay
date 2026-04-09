const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const ctrl = require('../controllers/equipmentController');

router.use(protect);

router.route('/')
  .get(authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('equipment'), ctrl.listEquipment)
  .post(authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('equipment'), ctrl.createEquipment);

router.route('/:id')
  .get(authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('equipment'), ctrl.getEquipment)
  .put(authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('equipment'), ctrl.updateEquipment)
  .delete(authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('equipment'), ctrl.deleteEquipment);

// Units management
router.post('/:id/units/manage', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('equipment'), ctrl.manageUnits); // body: { addCount?, removeSerials? }
router.patch('/:id/units/:serial/state', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('equipment'), ctrl.updateUnitState); // body: { state }
router.patch('/:id/units/:serial', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('equipment'), ctrl.updateUnit); // body: { name?, state?, notes? }

module.exports = router;

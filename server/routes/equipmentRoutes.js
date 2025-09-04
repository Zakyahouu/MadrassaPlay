const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/equipmentController');

router.use(protect);

router.route('/')
  .get(ctrl.listEquipment)
  .post(ctrl.createEquipment);

router.route('/:id')
  .get(ctrl.getEquipment)
  .put(ctrl.updateEquipment)
  .delete(ctrl.deleteEquipment);

// Units management
router.post('/:id/units', ctrl.adjustUnits); // body: { delta: +N | -N }
router.patch('/:id/units/:serial/state', ctrl.updateUnitState); // body: { state }
router.patch('/:id/units/:serial', ctrl.updateUnit); // body: { name?, state?, notes? }

module.exports = router;

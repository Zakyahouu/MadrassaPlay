const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/roomController');

router.use(protect);

router.route('/')
  .get(ctrl.listRooms)
  .post(ctrl.createRoom);

router.route('/:id')
  .get(ctrl.getRoom)
  .put(ctrl.updateRoom)
  .delete(ctrl.deleteRoom);

module.exports = router;

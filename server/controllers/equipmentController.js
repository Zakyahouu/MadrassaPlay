const Equipment = require('../models/Equipment');

function getUserSchoolId(user) {
  if (!user) return undefined;
  const s = user.school;
  if (!s) return undefined;
  if (typeof s === 'string') return s;
  if (typeof s === 'object' && s !== null) {
    if (s._id) return s._id.toString();
  }
  try { return s.toString(); } catch (e) { return undefined; }
}

function assertManagerAccess(req, resourceSchoolId) {
  if (req.user.role === 'admin') return true;
  const userSchoolId = getUserSchoolId(req.user);
  const resourceId = resourceSchoolId?.toString?.() ?? String(resourceSchoolId);
  if (req.user.role === 'manager' && userSchoolId && resourceId && userSchoolId === resourceId) return true;
  return false;
}

exports.listEquipment = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'manager') {
  query.schoolId = getUserSchoolId(req.user);
    } else if (req.user.role === 'admin' && req.query.schoolId) {
      query.schoolId = req.query.schoolId;
    }
  if (req.query.majorType) query.majorType = req.query.majorType;
  // state filter removed (no query by unit state)
    const items = await Equipment.find(query).sort({ majorType: 1, itemName: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getEquipment = async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    if (!assertManagerAccess(req, item.schoolId)) return res.status(403).json({ message: 'Not authorized' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.createEquipment = async (req, res) => {
  try {
  const schoolId = req.user.role === 'manager' ? getUserSchoolId(req.user) : (req.body.schoolId || req.query.schoolId);
    if (!schoolId) return res.status(400).json({ message: 'schoolId is required' });

    const { majorType, itemName, quantity } = req.body;
    if (!majorType || !itemName || quantity === undefined) {
      return res.status(400).json({ message: 'majorType, itemName and quantity are required' });
    }
    if (quantity < 0) return res.status(400).json({ message: 'quantity must be >= 0' });

  // Initialize units with serials 1..quantity in Working Fine state and default names
  const units = Array.from({ length: quantity }, (_, i) => ({ serial: i + 1, name: `#${i + 1}`, state: 'Working Fine' }));
    const created = await Equipment.create({ schoolId, majorType, itemName, units });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This equipment already exists in your school.' });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.updateEquipment = async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    if (!assertManagerAccess(req, item.schoolId)) return res.status(403).json({ message: 'Not authorized' });

  const { majorType, itemName } = req.body;
    if (majorType !== undefined) item.majorType = majorType;
    if (itemName !== undefined) item.itemName = itemName;
    
    await item.save();
    res.json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This equipment already exists in your school.' });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.deleteEquipment = async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    if (!assertManagerAccess(req, item.schoolId)) return res.status(403).json({ message: 'Not authorized' });
    await item.deleteOne();
    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// POST /api/equipment/:id/units/manage -> add units and/or remove specific serials
exports.manageUnits = async (req, res) => {
  try {
    const rawAddCount = req.body.addCount ?? 0;
    const addCount = Number(rawAddCount);
    const removeSerials = Array.isArray(req.body.removeSerials) ? req.body.removeSerials : [];

    if (!Number.isInteger(addCount) || addCount < 0) {
      return res.status(400).json({ message: 'addCount must be a non-negative integer' });
    }

    const serialsToRemove = Array.from(
      new Set(removeSerials.map(value => Number(value)).filter(value => Number.isInteger(value)))
    );

    if (addCount === 0 && serialsToRemove.length === 0) {
      return res.status(400).json({ message: 'No unit changes requested' });
    }

    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    if (!assertManagerAccess(req, item.schoolId)) return res.status(403).json({ message: 'Not authorized' });

    const units = item.units || [];
    const existingSerials = new Set(units.map(unit => unit.serial));
    const missingSerials = serialsToRemove.filter(serial => !existingSerials.has(serial));
    if (missingSerials.length > 0) {
      return res.status(400).json({ message: `Units not found: ${missingSerials.join(', ')}` });
    }

    let nextUnits = units.filter(unit => !serialsToRemove.includes(unit.serial));
    if (addCount > 0) {
      const maxSerial = nextUnits.reduce((max, unit) => Math.max(max, unit.serial), 0);
      const newUnits = Array.from({ length: addCount }, (_, i) => {
        const serial = maxSerial + i + 1;
        return { serial, name: `#${serial}`, state: 'Working Fine' };
      });
      nextUnits = [...nextUnits, ...newUnits];
    }

    item.units = nextUnits;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// PATCH /api/equipment/:id/units/:serial/state -> set state for a single unit
exports.updateUnitState = async (req, res) => {
  try {
    const { serial } = req.params;
    const { state } = req.body; // 'Working Fine' | 'Broken' | 'Under Maintenance'
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    if (!assertManagerAccess(req, item.schoolId)) return res.status(403).json({ message: 'Not authorized' });

    const unit = (item.units || []).find(u => u.serial === Number(serial));
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    if (!['Working Fine', 'Broken', 'Under Maintenance'].includes(state)) {
      return res.status(400).json({ message: 'Invalid state' });
    }
    unit.state = state;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// PATCH /api/equipment/:id/units/:serial -> update fields for a single unit (name, state, notes)
exports.updateUnit = async (req, res) => {
  try {
    const { serial } = req.params;
    const { state, name, notes } = req.body;
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    if (!assertManagerAccess(req, item.schoolId)) return res.status(403).json({ message: 'Not authorized' });

    const unit = (item.units || []).find(u => u.serial === Number(serial));
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    if (state !== undefined) {
      if (!['Working Fine', 'Broken', 'Under Maintenance'].includes(state)) {
        return res.status(400).json({ message: 'Invalid state' });
      }
      unit.state = state;
    }
    if (name !== undefined) unit.name = String(name);
    if (notes !== undefined) unit.notes = String(notes);

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

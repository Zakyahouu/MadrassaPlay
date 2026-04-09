const Room = require('../models/Room');
const ClassModel = require('../models/Class');
const SchoolCatalog = require('../models/SchoolCatalog');

// Helper: normalize user.school to an id string whether it's populated (document) or ObjectId/string
function getUserSchoolId(user) {
  if (!user) return undefined;
  const s = user.school;
  if (!s) return undefined;
  if (typeof s === 'string') return s;
  if (typeof s === 'object' && s !== null) {
    if (s._id) return s._id.toString();
  }
  try {
    return s.toString();
  } catch (e) {
    return undefined;
  }
}

// Helper: ensure manager access to resource by school
function assertManagerAccess(req, resourceSchoolId) {
  if (req.user.role === 'admin') return true;
  const userSchoolId = getUserSchoolId(req.user);
  const resourceId = resourceSchoolId?.toString?.() ?? String(resourceSchoolId);
  if (req.user.role === 'manager' && userSchoolId && resourceId && userSchoolId === resourceId) return true;
  return false;
}

const ACTIVITY_TYPE_KEYS = [
  'supportLessons',
  'reviewCourses',
  'vocationalTrainings',
  'languages',
  'otherActivities'
];

const ACTIVITY_TYPE_LABEL_TO_KEY = new Map([
  ['support lessons', 'supportLessons'],
  ['review courses', 'reviewCourses'],
  ['vocational trainings', 'vocationalTrainings'],
  ['vocational training', 'vocationalTrainings'],
  ['languages', 'languages'],
  ['other activities', 'otherActivities']
]);

const normalizeActivityType = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (ACTIVITY_TYPE_KEYS.includes(trimmed)) return trimmed;
  const lowered = trimmed.toLowerCase();
  return ACTIVITY_TYPE_LABEL_TO_KEY.get(lowered) || trimmed;
};

const normalizeActivityTypes = (activityTypes = []) => {
  if (!Array.isArray(activityTypes)) return [];
  const seen = new Set();
  const normalized = [];
  activityTypes.forEach((value) => {
    const next = normalizeActivityType(value);
    if (!next || seen.has(next)) return;
    seen.add(next);
    normalized.push(next);
  });
  return normalized;
};

const buildAllowedActivityTypes = (catalog) => {
  const allowed = new Set();
  if (Array.isArray(catalog.supportLessons) && catalog.supportLessons.length) allowed.add('supportLessons');
  if (Array.isArray(catalog.reviewCourses) && catalog.reviewCourses.length) allowed.add('reviewCourses');
  if (Array.isArray(catalog.vocationalTrainings) && catalog.vocationalTrainings.length) allowed.add('vocationalTrainings');
  if (Array.isArray(catalog.languages) && catalog.languages.length) allowed.add('languages');
  if (Array.isArray(catalog.otherActivities) && catalog.otherActivities.length) allowed.add('otherActivities');
  return allowed;
};

// Validate activityTypes against SchoolCatalog for the manager's school
async function validateActivityTypesForSchool(schoolId, activityTypes = []) {
  if (!Array.isArray(activityTypes) || activityTypes.length === 0) {
    return { valid: true, normalized: [] };
  }
  const catalog = await SchoolCatalog.findOne({ schoolId });
  if (!catalog) return { valid: false, normalized: [] };

  const allowed = buildAllowedActivityTypes(catalog);
  const normalized = normalizeActivityTypes(activityTypes);

  const invalid = normalized.filter((value) => ACTIVITY_TYPE_KEYS.includes(value) && !allowed.has(value));
  return { valid: invalid.length === 0, normalized };
}

exports.listRooms = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'manager') {
  query.schoolId = getUserSchoolId(req.user);
    } else if (req.user.role === 'admin' && req.query.schoolId) {
      query.schoolId = req.query.schoolId;
    }
    const rooms = await Room.find(query).sort({ name: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!assertManagerAccess(req, room.schoolId)) return res.status(403).json({ message: 'Not authorized' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
  const schoolId = req.user.role === 'manager' ? getUserSchoolId(req.user) : (req.body.schoolId || req.query.schoolId);
    if (!schoolId) return res.status(400).json({ message: 'schoolId is required' });

    const { name, capacity, activityTypes } = req.body;
    if (!name || !capacity) return res.status(400).json({ message: 'name and capacity are required' });
    if (capacity < 1) return res.status(400).json({ message: 'capacity must be at least 1' });

    // Validate activity types from SchoolCatalog
    const { valid, normalized } = await validateActivityTypesForSchool(schoolId, activityTypes);
    if (!valid) return res.status(400).json({ message: 'Invalid activityTypes for this school catalog' });

    const room = await Room.create({ schoolId, name, capacity, activityTypes: normalized });
    res.status(201).json(room);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A room with this name already exists in your school.' });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!assertManagerAccess(req, room.schoolId)) return res.status(403).json({ message: 'Not authorized' });

    const { name, capacity, activityTypes } = req.body;
    if (name !== undefined) room.name = name;
    if (capacity !== undefined) {
      if (capacity < 1) return res.status(400).json({ message: 'capacity must be at least 1' });
      room.capacity = capacity;
    }
    if (activityTypes !== undefined) {
      const { valid, normalized } = await validateActivityTypesForSchool(room.schoolId, activityTypes);
      if (!valid) return res.status(400).json({ message: 'Invalid activityTypes for this school catalog' });
      room.activityTypes = normalized;
    }

    await room.save();
    res.json(room);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A room with this name already exists in your school.' });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!assertManagerAccess(req, room.schoolId)) return res.status(403).json({ message: 'Not authorized' });

    // Prevent deletion if classes assigned
    const dependent = await ClassModel.findOne({ room: room._id });
    if (dependent) {
      return res.status(409).json({ message: 'Room cannot be deleted while assigned to one or more classes.' });
    }

    await room.deleteOne();
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

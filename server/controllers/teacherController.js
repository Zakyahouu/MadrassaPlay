const User = require('../models/User'); // Using the User model instead of a separate Teacher model
const SchoolCatalog = require('../models/SchoolCatalog');

function normalizeItem(type, item) {
  // Strip _id and unknown props; sort arrays for stability
  if (!item || typeof item !== 'object') return item;
  const pick = (obj, keys) => keys.reduce((o, k) => {
    if (obj[k] !== undefined && obj[k] !== null) o[k] = obj[k];
    return o;
  }, {});

  switch (type) {
    case 'supportLessons':
    case 'reviewCourses': {
      const base = pick(item, ['level', 'grade', 'subject', 'stream']);
      if (!base.stream || base.level !== 'high_school') delete base.stream;
      return base;
    }
    case 'languages': {
      const base = pick(item, ['language', 'levels']);
      if (Array.isArray(base.levels)) base.levels = [...base.levels].sort();
      return base;
    }
    case 'vocationalTrainings': {
      const base = pick(item, ['field', 'specialty', 'certificateType', 'gender']);
      if (item.ageRange && (item.ageRange.min !== undefined || item.ageRange.max !== undefined)) {
        base.ageRange = {};
        if (item.ageRange.min !== undefined) base.ageRange.min = item.ageRange.min;
        if (item.ageRange.max !== undefined) base.ageRange.max = item.ageRange.max;
      }
      return base;
    }
    case 'otherActivities': {
      return pick(item, ['activityType', 'activityName']);
    }
    default:
      return item;
  }
}

async function validateActivitiesAgainstCatalog(schoolId, activities) {
  if (!Array.isArray(activities) || activities.length === 0) return { ok: true, activities: [] };
  const catalog = await SchoolCatalog.findOne({ schoolId });
  if (!catalog) {
    // No catalog yet: accept but drop activities
    return { ok: true, activities: [] };
  }
  const types = ['supportLessons','reviewCourses','vocationalTrainings','languages','otherActivities'];
  const allowedMap = {};
  const idMap = {};
  for (const t of types) {
    const arr = Array.isArray(catalog[t]) ? catalog[t] : [];
    idMap[t] = new Set(arr.map(x => x && x._id ? x._id.toString() : ''));
    allowedMap[t] = new Set(arr.map(x => JSON.stringify(normalizeItem(t, x))));
  }
  // Build filtered activities, removing disallowed entries
  const filtered = [];
  for (const act of activities) {
    if (!act || !act.type || !types.includes(act.type)) continue;
    const items = Array.isArray(act.items) ? act.items : [];
    const kept = [];
    for (const it of items) {
      if (it && it._id && idMap[act.type].has(it._id.toString())) { kept.push(it); continue; }
      const key = JSON.stringify(normalizeItem(act.type, it));
      if (allowedMap[act.type].has(key)) kept.push(it);
    }
    if (kept.length) filtered.push({ type: act.type, items: kept });
  }
  return { ok: true, activities: filtered };
}

// @desc    Get all teachers for the manager's school
// @route   GET /api/teachers
const getTeachersForSchool = async (req, res) => {
  try {
    const schoolId = req.user?.school?._id?.toString?.() || req.user?.school?.toString?.() || req.user?.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'User is not associated with a school.' });
    }
    if (!schoolId) {
      return res.status(400).json({ message: "User is not associated with a school." });
    }
    // Find users with the role 'teacher' belonging to the manager's school
    const query = { role: 'teacher', school: schoolId };
    if (req.query.status) {
      const s = req.query.status.toString().toLowerCase();
      if (['retired','employed','freelance'].includes(s)) query.teacherStatus = s;
    }
    const teachers = await User.find(query).select('-password');
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teachers", error: error.message });
  }
};

// @desc    Create a new teacher for the manager's school
// @route   POST /api/teachers
const createTeacher = async (req, res) => {
  try {
    const schoolId = req.user?.school?._id?.toString?.() || req.user?.school?.toString?.() || req.user?.school;
    const {
      firstName, lastName,
      phone1, phone2, email, address,
      yearsExperience,
  status, // employed | freelance | retired
      banking = {}, // { ccp, bankAccount }
      username, password,
      activities = [], // array of { type, items }
    } = req.body;

    if (!firstName || !lastName || !email || !password || !phone1 || !username) {
      return res.status(400).json({ message: 'firstName, lastName, email, username, password, phone1 are required.' });
    }

    // Normalize inputs
    const normalizedEmail = email.toString().trim().toLowerCase();
    const normalizedUsername = username.toString().trim();

  // debug logs removed

    // Check duplicates (email and username)
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }
    const usernameExists = await User.findOne({ username: normalizedUsername });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already exists. Please choose another.' });
    }

  const normalizedStatus = (status || 'employed').toString().toLowerCase(); // employed | freelance | retired

    // Validate activities against school catalog
  const valid = await validateActivitiesAgainstCatalog(schoolId, activities);

    const teacherData = {
      firstName,
      lastName,
  email: normalizedEmail,
  username: normalizedUsername,
      password, // hashed via pre-save hook
      role: 'teacher',
      school: schoolId,
      experience: Number(yearsExperience) || 0,
  teacherStatus: ['retired','employed','freelance'].includes(normalizedStatus) ? normalizedStatus : 'employed',
      contact: { phone1, phone2, address },
      banking: { ccp: banking.ccp, bankAccount: banking.bankAccount },
  activities: valid.activities || [],
    };

  // debug logs removed

    const newTeacher = new User(teacherData);
    const savedTeacher = await newTeacher.save();
    const teacherResponse = savedTeacher.toObject();
    delete teacherResponse.password;
    res.status(201).json({ message: 'Teacher created successfully', teacher: teacherResponse });
  } catch (error) {
    // Map common Mongoose errors to user-friendly messages
    let message = 'Error creating teacher';
    if (error && error.code === 11000) {
      // Duplicate key error
      const fields = Object.keys(error.keyPattern || {});
      if (fields.includes('email')) message = 'User with this email already exists.';
      else if (fields.includes('username')) message = 'Username already exists. Please choose another.';
      else message = fields.length ? `Duplicate value for unique field(s): ${fields.join(', ')}` : 'Duplicate value for a unique field.';
    } else if (error && error.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map(e => e.message).filter(Boolean).join(', ');
      if (details) message = details;
    } else if (typeof error.message === 'string' && /Cast to ObjectId failed/i.test(error.message)) {
      message = 'Invalid identifier provided.';
    }
    res.status(400).json({ message, error: error.message });
  }
};

// @desc    Get a single teacher by their ID (ensuring they are in the manager's school)
// @route   GET /api/teachers/:id
const getTeacherById = async (req, res) => {
  try {
  const user = await User.findById(req.params.id).select('-password');
  const managerSchoolId = req.user?.school?._id?.toString?.() || req.user?.school?.toString?.() || req.user?.school;
  // Security check: ensure the user exists, is a teacher, and belongs to the manager's school
  if (!user || user.role !== 'teacher' || (user.school?.toString?.() !== managerSchoolId?.toString?.())) {
      return res.status(404).json({ message: "Teacher not found in your school" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teacher", error: error.message });
  }
};

// @desc    Update a teacher's information (ensuring they are in the manager's school)
// @route   PUT /api/teachers/:id
const updateTeacher = async (req, res) => {
    try {
  const user = await User.findById(req.params.id);
  const managerSchoolId = req.user?.school?._id?.toString?.() || req.user?.school?.toString?.() || req.user?.school;
        // Security check: ensure user is a teacher in the manager's school
  if (!user || user.role !== 'teacher' || (user.school?.toString?.() !== managerSchoolId?.toString?.())) {
            return res.status(404).json({ message: "Teacher not found in your school" });
        }
        
        // Prevent changing role or password via this endpoint
        const updateData = { ...req.body };
        delete updateData.role; 
        delete updateData.password;
        // Remove legacy fields
        delete updateData.subject;
        delete updateData.department;
        if (updateData.status) {
          const s = updateData.status.toString().toLowerCase();
          if (['retired','employed','freelance'].includes(s)) updateData.teacherStatus = s; 
          delete updateData.status;
        }
        if (updateData.yearsExperience !== undefined) {
          updateData.experience = Number(updateData.yearsExperience) || 0;
          delete updateData.yearsExperience;
        }
        if (updateData.activities !== undefined) {
          if (!Array.isArray(updateData.activities)) {
            delete updateData.activities; // ignore invalid shape
          } else {
            const valid = await validateActivitiesAgainstCatalog(managerSchoolId, updateData.activities);
            updateData.activities = valid.activities || [];
          }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ message: "Teacher updated successfully", teacher: updatedUser });
    } catch (error) {
        res.status(400).json({ message: "Error updating teacher", error: error.message });
    }
};

// @desc    Delete a teacher (ensuring they are in the manager's school)
//          Guard: cannot delete if assigned to any classes
// @route   DELETE /api/teachers/:id
const deleteTeacher = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const managerSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
    if (!user || user.role !== 'teacher' || user.school.toString() !== managerSchoolId) {
      return res.status(404).json({ message: "Teacher not found in your school" });
    }

    // Guard: check if teacher is currently assigned to any classes
    const Class = require('../models/Class');
    const assignedClasses = await Class.find({ teacherId: user._id, schoolId: managerSchoolId })
      .select('_id name')
      .lean();
    if (Array.isArray(assignedClasses) && assignedClasses.length > 0) {
      return res.status(409).json({
        message: 'Cannot delete teacher while assigned to classes. Reassign or update those classes first.',
        blockingClasses: assignedClasses,
        count: assignedClasses.length,
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting teacher", error: error.message });
  }
};

module.exports = {
  getTeachersForSchool,
  createTeacher,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};

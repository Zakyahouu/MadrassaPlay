const User = require('../models/User'); // Using the User model instead of a separate Teacher model
const SchoolCatalog = require('../models/SchoolCatalog');

async function validateActivitiesAgainstCatalog(schoolId, activities) {
  if (!Array.isArray(activities) || activities.length === 0) return { ok: true };
  const catalog = await SchoolCatalog.findOne({ schoolId });
  if (!catalog) return { ok: false, message: 'School catalog not found' };
  const types = ['supportLessons','reviewCourses','vocationalTrainings','languages','otherActivities'];
  const allowedMap = {};
  for (const t of types) {
    const arr = Array.isArray(catalog[t]) ? catalog[t] : [];
    allowedMap[t] = new Set(arr.map(x => JSON.stringify(x)));
  }
  for (const act of activities) {
    if (!act || !act.type || !types.includes(act.type)) {
      return { ok: false, message: `Invalid activity type: ${act?.type}` };
    }
    const items = Array.isArray(act.items) ? act.items : [];
    for (const it of items) {
      const key = JSON.stringify(it);
      if (!allowedMap[act.type].has(key)) {
        return { ok: false, message: `Activity item not allowed for type ${act.type}` };
      }
    }
  }
  return { ok: true };
}

// @desc    Get all teachers for the manager's school
// @route   GET /api/teachers
const getTeachersForSchool = async (req, res) => {
  try {
    const schoolId = req.user.school;
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
    const schoolId = req.user.school;
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

  const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

  const normalizedStatus = (status || 'employed').toString().toLowerCase(); // employed | freelance | retired

    // Validate activities against school catalog
    const valid = await validateActivitiesAgainstCatalog(schoolId, activities);
    if (!valid.ok) {
      return res.status(400).json({ message: valid.message || 'Invalid activities selection' });
    }

    const teacherData = {
      firstName,
      lastName,
      email,
      username,
      password, // hashed via pre-save hook
      role: 'teacher',
      school: schoolId,
      experience: Number(yearsExperience) || 0,
  teacherStatus: ['retired','employed','freelance'].includes(normalizedStatus) ? normalizedStatus : 'employed',
      contact: { phone1, phone2, address },
      banking: { ccp: banking.ccp, bankAccount: banking.bankAccount },
      activities,
    };

    const newTeacher = new User(teacherData);
    const savedTeacher = await newTeacher.save();
    const teacherResponse = savedTeacher.toObject();
    delete teacherResponse.password;
    res.status(201).json({ message: 'Teacher created successfully', teacher: teacherResponse });
  } catch (error) {
    res.status(400).json({ message: 'Error creating teacher', error: error.message });
  }
};

// @desc    Get a single teacher by their ID (ensuring they are in the manager's school)
// @route   GET /api/teachers/:id
const getTeacherById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    // Security check: ensure the user exists, is a teacher, and belongs to the manager's school
    if (!user || user.role !== 'teacher' || user.school.toString() !== req.user.school.toString()) {
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
        
        // Security check: ensure user is a teacher in the manager's school
        if (!user || user.role !== 'teacher' || user.school.toString() !== req.user.school.toString()) {
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
            const valid = await validateActivitiesAgainstCatalog(req.user.school, updateData.activities);
            if (!valid.ok) {
              return res.status(400).json({ message: valid.message || 'Invalid activities selection' });
            }
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
// @route   DELETE /api/teachers/:id
const deleteTeacher = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        // Security check: ensure user is a teacher in the manager's school
        if (!user || user.role !== 'teacher' || user.school.toString() !== req.user.school.toString()) {
            return res.status(404).json({ message: "Teacher not found in your school" });
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

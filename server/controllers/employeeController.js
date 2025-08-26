const User = require('../models/User');

function ensureManager(req) {
  if (!(req.user && (req.user.role === 'manager' || req.user.role === 'admin'))) {
    const err = new Error('Not authorized');
    err.status = 403;
    throw err;
  }
}

exports.listEmployees = async (req, res) => {
  try {
    ensureManager(req);
    const schoolId = req.user.role === 'manager' ? req.user.school : (req.query.schoolId || req.user.school);
    // Represent employees as Users who are not student/teacher/admin/manager
    const baseQuery = { school: schoolId, role: { $nin: ['student','teacher','admin','manager'] } };
    // Type mapping: Staff -> role 'staff', Other -> role 'employee' (generic)
    if (req.query.type === 'Staff') baseQuery.role = 'staff';
    if (req.query.type === 'Other') baseQuery.role = 'employee';
  if (req.query.contractType) baseQuery.contractType = req.query.contractType;
  if (req.query.status) baseQuery.staffStatus = req.query.status;
    const users = await User.find(baseQuery).select('-password').sort({ lastName: 1, firstName: 1 });
    // Normalize response to employee-like shape expected by UI
    const items = users.map(u => ({
      _id: u._id,
      type: u.role === 'staff' ? 'Staff' : 'Other',
      firstName: u.firstName,
      lastName: u.lastName,
      contact: u.contact || {},
      educationLevel: u.educationLevel,
      contractType: u.contractType,
      startDate: u.startDate,
      salary: u.salary,
      banking: u.banking || {},
  permissions: u.permissions || [],
  status: u.staffStatus,
    }));
    res.json(items);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server Error' });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    ensureManager(req);
    const u = await User.findById(req.params.id).select('-password');
    if (!u) return res.status(404).json({ message: 'Employee not found' });
    if (req.user.role === 'manager' && u.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({
      _id: u._id,
      type: u.role === 'staff' ? 'Staff' : 'Other',
      firstName: u.firstName,
      lastName: u.lastName,
      contact: u.contact || {},
      educationLevel: u.educationLevel,
      contractType: u.contractType,
      startDate: u.startDate,
      salary: u.salary,
      banking: u.banking || {},
  permissions: u.permissions || [],
  status: u.staffStatus,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server Error' });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    ensureManager(req);
    const schoolId = req.user.role === 'manager' ? req.user.school : (req.body.schoolId || req.user.school);
  const { type, firstName, lastName, contact = {}, educationLevel, contractType, startDate, salary, /* banking removed */ /* permissions UI-only */ username, password, status } = req.body;
    if (!type || !firstName || !lastName || !contact.phone1) {
      return res.status(400).json({ message: 'type, firstName, lastName, phone1 are required' });
    }
    const role = type === 'Staff' ? 'staff' : 'employee';
    if (role === 'staff') {
      if (!password || !contact.email) return res.status(400).json({ message: 'email and password required for Staff' });
      const exists = await User.findOne({ email: contact.email });
      if (exists) return res.status(400).json({ message: 'User with this email already exists' });
    }
    const user = new User({
      firstName, lastName,
      email: contact.email,
      username,
      password: role === 'staff' ? password : (Math.random().toString(36).slice(2)), // temp password for Other
      role,
      school: schoolId,
      contact,
      educationLevel,
      contractType,
      startDate,
      salary,
  // banking ignored
  // Permissions intentionally ignored (UI-only)
  permissions: [],
  staffStatus: status || 'active',
    });
    const saved = await user.save();
    const out = saved.toObject(); delete out.password;
    res.status(201).json({
      _id: out._id,
      type,
      firstName: out.firstName,
      lastName: out.lastName,
      contact: out.contact,
      educationLevel: out.educationLevel,
      contractType: out.contractType,
      startDate: out.startDate,
      salary: out.salary,
      banking: out.banking,
  permissions: out.permissions || [],
  status: out.status,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server Error' });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    ensureManager(req);
    const item = await User.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Employee not found' });
    if (req.user.role === 'manager' && item.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const body = req.body;
    if (body.type && !((body.type === 'Staff' && item.role === 'staff') || (body.type === 'Other' && item.role === 'employee'))) {
      return res.status(400).json({ message: 'Changing employee type is not supported yet' });
    }
  ['firstName','lastName','contact','educationLevel','contractType','startDate','salary'].forEach(k=>{
      if (body[k] !== undefined) item[k] = body[k];
    });
    if (body.status !== undefined) item.staffStatus = body.status;
  // Ignore permissions updates (UI-only)
    const saved = await item.save();
    const out = saved.toObject(); delete out.password;
    res.json({
      _id: out._id,
      type: out.role === 'staff' ? 'Staff' : 'Other',
      firstName: out.firstName,
      lastName: out.lastName,
      contact: out.contact,
      educationLevel: out.educationLevel,
      contractType: out.contractType,
      startDate: out.startDate,
      salary: out.salary,
      banking: out.banking,
  permissions: out.permissions || [],
  status: out.status,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server Error' });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    ensureManager(req);
  const item = await User.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Employee not found' });
  if (req.user.role === 'manager' && item.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
  await item.deleteOne();
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server Error' });
  }
};

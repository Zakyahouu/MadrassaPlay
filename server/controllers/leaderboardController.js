// server/controllers/leaderboardController.js

const User = require('../models/User');
const Class = require('../models/Class');

// Helper to ensure metric
const getMetricField = (metric) => (metric === 'points' ? 'totalPoints' : 'xp');

// @desc    Top students in a school
// @route   GET /api/leaderboard/school?metric=xp|points&limit=10&school=<id>
// @access  Private (admin/manager/teacher)
const topStudentsBySchool = async (req, res) => {
  try {
    const metric = getMetricField(req.query.metric);
  const limit = Math.max(1, Math.min(parseInt(req.query.limit || '10', 10), 100));
  const offset = Math.max(0, parseInt(req.query.offset || '0', 10));
  let schoolId = req.query.school;
  const sinceStr = req.query.since;
  const sinceDate = sinceStr ? new Date(sinceStr) : null;

    // If no school provided, derive from requester when possible
    if (!schoolId && req.user && req.user.school) schoolId = req.user.school;

    if (!schoolId) {
      return res.status(400).json({ message: 'School id is required for this leaderboard.' });
    }

  const query = { role: 'student', school: schoolId };
  if (sinceDate && !isNaN(sinceDate.getTime())) query.updatedAt = { $gte: sinceDate };
  const students = await User.find(query)
      .select(`name level xp totalPoints`)
      .sort({ [metric]: -1, name: 1 })
      .skip(offset)
      .limit(limit);

    res.json({ metric, items: students });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Top students in a specific class
// @route   GET /api/leaderboard/class/:classId?metric=xp|points&limit=10
// @access  Private (admin/manager/teacher)
const topStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const metric = getMetricField(req.query.metric);
  const limit = Math.max(1, Math.min(parseInt(req.query.limit || '10', 10), 100));
  const offset = Math.max(0, parseInt(req.query.offset || '0', 10));

  const klass = await Class.findById(classId).select('teacherId schoolId enrolledStudents');
    if (!klass) return res.status(404).json({ message: 'Class not found.' });

    // Light authorization: teachers can access their classes; managers/admins can access within their school
    if (req.user.role === 'teacher' && klass.teacherId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this class leaderboard.' });
    }
    if (req.user.role === 'manager') {
      const managerSchoolId = req.user.school?._id?.toString?.() || req.user.school?.toString?.();
      if (managerSchoolId !== klass.schoolId?.toString()) {
        return res.status(403).json({ message: 'Managers can only access leaderboards in their school.' });
      }
    }

  const studentIds = (klass.enrolledStudents || []).map(e => e.studentId).filter(Boolean);
  const classQuery = { _id: { $in: studentIds } };
  const sinceStr2 = req.query.since;
  const sinceDate2 = sinceStr2 ? new Date(sinceStr2) : null;
  if (sinceDate2 && !isNaN(sinceDate2.getTime())) classQuery.updatedAt = { $gte: sinceDate2 };
  const students = await User.find(classQuery)
      .select('name level xp totalPoints')
      .sort({ [metric]: -1, name: 1 })
      .skip(offset)
      .limit(limit);

    res.json({ metric, items: students });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

module.exports = { topStudentsBySchool, topStudentsByClass };

// Additional endpoints: compute current user's rank within school or class

// @desc    Current user's rank in their school
// @route   GET /api/leaderboard/school/rank?metric=xp|points&school=<id>
// @access  Private
const myRankInSchool = async (req, res) => {
  try {
    const metricField = getMetricField(req.query.metric);
    let schoolId = req.query.school;
    if (!schoolId && req.user && req.user.school) schoolId = req.user.school;

    if (!schoolId) return res.status(400).json({ message: 'School id is required.' });

    const me = await User.findById(req.user._id).select(`role ${metricField}`);
    if (!me) return res.status(404).json({ message: 'User not found.' });

    // Ensure the cohort exists
    const total = await User.countDocuments({ role: 'student', school: schoolId });
    const myVal = me[metricField] || 0;
    const higher = await User.countDocuments({ role: 'student', school: schoolId, [metricField]: { $gt: myVal } });
    const rank = higher + 1;

    res.json({ metric: metricField, rank, total });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Current user's rank within a class
// @route   GET /api/leaderboard/class/:classId/rank?metric=xp|points
// @access  Private
const myRankInClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const metricField = getMetricField(req.query.metric);

  const klass = await Class.findById(classId).select('enrolledStudents teacherId schoolId');
    if (!klass) return res.status(404).json({ message: 'Class not found.' });

    // Authorization: student must belong to class, or teacher/manager/admin with proper scope
  const isStudentInClass = (klass.enrolledStudents || []).some(e => e.studentId?.toString() === req.user._id.toString());
  const isTeacher = req.user.role === 'teacher' && klass.teacherId?.toString() === req.user._id.toString();
  const isManagerInSchool = req.user.role === 'manager' && ((req.user.school?._id?.toString?.() || req.user.school?.toString?.()) === klass.schoolId?.toString());
    const isAdmin = req.user.role === 'admin';
    if (!(isStudentInClass || isTeacher || isManagerInSchool || isAdmin)) {
      return res.status(403).json({ message: 'Not authorized to view this class rank.' });
    }

  const cohortIds = (klass.enrolledStudents || []).map(e => e.studentId).filter(Boolean);
    if (cohortIds.length === 0) return res.json({ metric: metricField, rank: 0, total: 0 });

    const me = await User.findById(req.user._id).select(metricField);
    if (!me) return res.status(404).json({ message: 'User not found.' });
    const myVal = me[metricField] || 0;

    const total = cohortIds.length;
    const higher = await User.countDocuments({ _id: { $in: cohortIds }, [metricField]: { $gt: myVal } });
    const rank = higher + 1;

    res.json({ metric: metricField, rank, total });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

module.exports.myRankInSchool = myRankInSchool;
module.exports.myRankInClass = myRankInClass;

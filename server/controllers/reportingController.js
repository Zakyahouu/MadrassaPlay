// server/controllers/reportingController.js
const Assignment = require('../models/Assignment');
const GameResult = require('../models/GameResult');
const Class = require('../models/Class');
const User = require('../models/User');

// @desc    Assignment progress summary
// @route   GET /api/reporting/assignments/:assignmentId/summary
// @access  Private (teacher/manager/admin)
const assignmentSummary = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId).select('teacher students classes title startDate endDate');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    // Teachers can only view their own assignments
    if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

  const totalStudents = Array.isArray(assignment.students) ? assignment.students.length : 0;
  // First attempt only: rely on counted=true
  const results = await GameResult.find({ assignment: assignmentId, counted: true }).select('student score totalPossibleScore');
  const submittedBy = new Set(results.map(r => r.student.toString()));
    const submittedCount = submittedBy.size;
    const pendingCount = Math.max(0, totalStudents - submittedCount);

    let totalScore = 0, totalPossible = 0;
    for (const r of results) { totalScore += r.score; totalPossible += r.totalPossibleScore; }
    const avgPercent = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    res.json({
      assignment: { id: assignment._id, title: assignment.title, startDate: assignment.startDate, endDate: assignment.endDate },
      totalStudents,
      submittedCount,
      pendingCount,
      averagePercentage: avgPercent,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Class performance summary across assignments
// @route   GET /api/reporting/classes/:classId/performance
// @access  Private (teacher/manager/admin)
const classPerformance = async (req, res) => {
  try {
    const { classId } = req.params;
    const klass = await Class.findById(classId).select('teacherId schoolId');
    if (!klass) return res.status(404).json({ message: 'Class not found.' });

    // Teachers: must own the class
    if (req.user.role === 'teacher' && klass.teacherId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    // Managers: must belong to the same school (req.user.school is populated in auth)
    if (req.user.role === 'manager') {
      const managerSchoolId = req.user.school?._id?.toString?.() || req.user.school?.toString?.();
      if (!managerSchoolId || managerSchoolId !== klass.schoolId?.toString()) {
        return res.status(403).json({ message: 'Managers can only access within their school.' });
      }
    }

    // Find assignments targeting this class
    const assignments = await Assignment.find({ classes: classId }).select('_id title');
    const assignmentIds = assignments.map(a => a._id);
  // First attempt only
  const results = await GameResult.find({ assignment: { $in: assignmentIds }, counted: true }).select('assignment score totalPossibleScore');

    const byAssignment = {};
    for (const a of assignments) byAssignment[a._id] = { title: a.title, totalScore: 0, totalPossible: 0 };
    for (const r of results) {
      const agg = byAssignment[r.assignment.toString()];
      if (agg) { agg.totalScore += r.score; agg.totalPossible += r.totalPossibleScore; }
    }
    const items = Object.entries(byAssignment).map(([id, v]) => ({
      assignmentId: id,
      title: v.title,
      averagePercentage: v.totalPossible > 0 ? Math.round((v.totalScore / v.totalPossible) * 100) : 0,
    }));

    res.json({ classId, items });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

module.exports = { assignmentSummary, classPerformance };
// @desc    Per-assignment student list with best percentage
// @route   GET /api/reporting/assignments/:assignmentId/students
// @access  Private (teacher/manager/admin)
module.exports.assignmentStudents = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId).select('teacher students');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

  const studentIds = Array.isArray(assignment.students) ? assignment.students : [];
  const students = await User.find({ _id: { $in: studentIds } }).select('_id name');
  const results = await GameResult.find({ assignment: assignmentId, counted: true })
      .select('student score totalPossibleScore createdAt')
      .sort({ createdAt: 1 }) // ensure increasing for lastSubmittedAt calc
      .lean();
    const aggByStudent = new Map();
    for (const r of results) {
      const key = r.student.toString();
      const pct = r.totalPossibleScore > 0 ? (r.score / r.totalPossibleScore) * 100 : 0;
      const current = aggByStudent.get(key) || { best: 0, count: 0, lastAt: null };
      current.best = Math.max(current.best, pct);
      current.count += 1;
      current.lastAt = r.createdAt; // sorted asc, will end at last
      aggByStudent.set(key, current);
    }
    const items = students.map(s => {
      const k = s._id.toString();
      const agg = aggByStudent.get(k);
      return {
        id: s._id,
        name: s.name,
        submitted: !!agg,
        attemptCount: agg?.count || 0,
        bestPercentage: Math.round(agg?.best || 0),
        lastSubmittedAt: agg?.lastAt || null,
      };
    });
  res.json({ assignmentId, items });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Per-student results history within a class (summarized per assignment/game)
// @route   GET /api/reporting/classes/:classId/students/:studentId/history
// @access  Private (teacher/manager/admin)
module.exports.classStudentHistory = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const klass = await Class.findById(classId).select('teacherId schoolId enrolledStudents');
    if (!klass) return res.status(404).json({ message: 'Class not found.' });

    const isTeacher = req.user.role === 'teacher';
    const isOwner = klass.teacherId?.toString() === req.user._id.toString();
    const isElevated = req.user.role === 'admin' || req.user.role === 'manager';
    if (isTeacher && !isOwner) return res.status(403).json({ message: 'Not authorized.' });
    if (!isTeacher && !isElevated) return res.status(403).json({ message: 'Not authorized.' });

    // Verify the student is enrolled in the class
    const enrolled = (klass.enrolledStudents || []).some(e => e.studentId?.toString() === studentId);
    if (!enrolled) return res.status(404).json({ message: 'Student not in class.' });

    // Scope assignments to this class (and this teacher if teacher role)
    const assignmentQuery = { classes: classId };
    if (isTeacher) assignmentQuery.teacher = req.user._id;
    const assignments = await Assignment.find(assignmentQuery).select('_id title');
    const assignmentIds = assignments.map(a => a._id);
    if (assignmentIds.length === 0) return res.json({ classId, studentId, assignments: [] });

    // Fetch results for this student across scoped assignments
  const results = await GameResult.find({ student: studentId, assignment: { $in: assignmentIds }, counted: true })
      .populate('assignment', 'title')
      .populate('gameCreation', 'name')
      .sort({ createdAt: 1 })
      .lean();

    // Group by assignment then game
    const byAssignment = new Map();
    for (const r of results) {
      const aid = r.assignment?._id?.toString() || r.assignment?.toString();
      const gid = r.gameCreation?._id?.toString() || r.gameCreation?.toString();
      if (!aid || !gid) continue;
      if (!byAssignment.has(aid)) byAssignment.set(aid, { assignmentId: aid, title: r.assignment?.title || 'Assignment', games: new Map() });
      const entry = byAssignment.get(aid);
      const gameName = r.gameCreation?.name || 'Game';
      const pct = r.totalPossibleScore > 0 ? (r.score / r.totalPossibleScore) * 100 : 0;
      const g = entry.games.get(gid) || { gameId: gid, name: gameName, attemptCount: 0, bestPercentage: 0, lastSubmittedAt: null };
      g.attemptCount += 1;
      g.bestPercentage = Math.max(g.bestPercentage, pct);
      g.lastSubmittedAt = r.createdAt;
      entry.games.set(gid, g);
    }

    const assignmentsOut = Array.from(byAssignment.values()).map(a => ({
      assignmentId: a.assignmentId,
      title: a.title,
      games: Array.from(a.games.values()).map(g => ({
        ...g,
        bestPercentage: Math.round(g.bestPercentage)
      }))
    }));

    res.json({ classId, studentId, assignments: assignmentsOut });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Attempts for a specific student within an assignment, grouped by game
// @route   GET /api/reporting/assignments/:assignmentId/students/:studentId/attempts
// @access  Private (teacher/manager/admin)
module.exports.assignmentStudentAttempts = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    // Verify assignment exists and access
    const assignment = await Assignment.findById(assignmentId).select('teacher students');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    // Teachers can only view their own assignment data; managers/admin allowed
    const isTeacher = req.user.role === 'teacher';
    const isOwner = assignment.teacher?.toString() === req.user._id.toString();
    const isElevated = req.user.role === 'admin' || req.user.role === 'manager';
    if (isTeacher && !isOwner) return res.status(403).json({ message: 'Not authorized.' });
    if (!isTeacher && !isElevated) return res.status(403).json({ message: 'Not authorized.' });

    // Ensure student is targeted by the assignment
  const isTargeted = Array.isArray(assignment.students) && assignment.students.map(s => s.toString()).includes(studentId?.toString());
    if (!isTargeted) {
      // Non-fatal: still allow if student has results (in case of legacy data), but mark notTargeted
    }

  const results = await GameResult.find({ assignment: assignmentId, student: studentId })
      .populate('gameCreation', 'name')
      .sort({ createdAt: 1 })
      .lean();

    // Group by game
    const byGame = new Map();
    for (const r of results) {
      const gid = r.gameCreation?._id?.toString() || r.gameCreation?.toString();
      const gname = r.gameCreation?.name || 'Game';
      if (!gid) continue;
      const list = byGame.get(gid) || { gameId: gid, name: gname, attempts: [], bestPercentage: 0 };
      const pct = r.totalPossibleScore > 0 ? (r.score / r.totalPossibleScore) * 100 : 0;
      list.attempts.push({
        attemptNumber: r.attemptNumber,
        score: r.score,
        totalPossibleScore: r.totalPossibleScore,
        percentage: Math.round(pct),
        counted: !!r.counted,
        createdAt: r.createdAt,
      });
      list.bestPercentage = Math.max(list.bestPercentage, pct);
      byGame.set(gid, list);
    }

    const games = Array.from(byGame.values()).map(g => ({
      ...g,
      bestPercentage: Math.round(g.bestPercentage),
      attemptCount: g.attempts.length,
    }));

    res.json({ assignmentId, studentId, games });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

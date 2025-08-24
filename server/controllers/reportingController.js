// server/controllers/reportingController.js
const Assignment = require('../models/Assignment');
const GameResult = require('../models/GameResult');
const Class = require('../models/Class');

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

    const totalStudents = assignment.students.length;
    const results = await GameResult.find({ assignment: assignmentId }).select('student score totalPossibleScore');
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
    const klass = await Class.findById(classId).select('teacher school students');
    if (!klass) return res.status(404).json({ message: 'Class not found.' });

    if (req.user.role === 'teacher' && klass.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (req.user.role === 'manager' && req.user.school?.toString() !== klass.school.toString()) {
      return res.status(403).json({ message: 'Managers can only access within their school.' });
    }

    // Find assignments targeting this class
    const assignments = await Assignment.find({ classes: classId }).select('_id title');
    const assignmentIds = assignments.map(a => a._id);
    const results = await GameResult.find({ assignment: { $in: assignmentIds } }).select('assignment score totalPossibleScore');

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

// server/controllers/assignmentController.js

const Assignment = require('../models/Assignment');
const User = require('../models/User'); // We need the User model to find students
const Class = require('../models/Class');
const GameResult = require('../models/GameResult');
const GameCreation = require('../models/GameCreation');
const { checkCanAttempt } = require('../services/attemptGate');

// Helper to derive status at read time using current server time (only if not canceled/completed)
function computeStatusFromDates(start, end, current) {
  if (current === 'canceled' || current === 'completed') return current;
  if (!start || !end) return current;
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now < s) return 'upcoming';
  if (now >= e) return 'completed';
  return 'active';
}

// Central attempt gating for a student attempting a specific game within an assignment
// Returns { allow: boolean, reason: 'assignment_completed'|'canceled'|'time_window'|'attempt_limit'|null, attemptNumber, attemptLimit, attemptsRemaining }
const getCanAttempt = async (req, res) => {
  try {
    const studentId = req.user._id;
    const assignmentId = req.params.id;
    const { gameId } = req.query;
    if (!gameId) return res.status(400).json({ message: 'Missing gameId' });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Authorization: student must be targeted directly or via class membership
    const inStudents = (assignment.students || []).map(s=>s.toString()).includes(studentId.toString());
    let inClasses = false;
    if (!inStudents) {
      const classCount = await Class.countDocuments({ _id: { $in: assignment.classes || [] }, 'enrolledStudents.studentId': studentId });
      inClasses = classCount > 0;
    }
    if (!inStudents && !inClasses) return res.status(403).json({ message: 'Not allowed' });

  const gate = await checkCanAttempt({ assignment, studentId, gameId });
  return res.json(gate);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private/Teacher
const createAssignment = async (req, res) => {
  try {
  const { title, description, gameCreations, startDate, endDate, classIds, attemptLimit } = req.body;

    // Basic validation
    if (!title || !gameCreations || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }
    if (attemptLimit !== undefined && (!Number.isInteger(attemptLimit) || attemptLimit < 1 || attemptLimit > 10)) {
      return res.status(400).json({ message: 'Attempt limit must be an integer between 1 and 10.' });
    }

    // Enforce class-only targeting
    if (!Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({ message: 'Select at least one class.' });
    }

    // Prevent assigning the same game to the same class concurrently (overlapping time window)
    if (Array.isArray(classIds) && classIds.length > 0 && Array.isArray(gameCreations) && gameCreations.length > 0) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const overlapping = await Assignment.find({
        teacher: req.user._id,
        status: { $nin: ['canceled', 'completed'] },
        startDate: { $lt: e }, // existing starts before new ends
        endDate: { $gt: s },   // existing ends after new starts
        gameCreations: { $in: gameCreations },
        classes: { $in: classIds },
      }).select('_id title classes gameCreations startDate endDate');
      if (overlapping.length) {
        // Build concise conflict pairs
        const classSet = new Set(classIds.map(x=>x.toString()));
        const gameSet = new Set(gameCreations.map(x=>x.toString()));
        const conflicts = [];
        for (const a of overlapping) {
          const aClasses = (a.classes||[]).map(x=>x.toString());
          const aGames = (a.gameCreations||[]).map(x=>x.toString());
          for (const c of aClasses) {
            if (!classSet.has(c)) continue;
            for (const g of aGames) {
              if (!gameSet.has(g)) continue;
              conflicts.push({ assignmentId: a._id, title: a.title, classId: c, gameCreationId: g });
              if (conflicts.length >= 10) break; // limit payload
            }
            if (conflicts.length >= 10) break;
          }
          if (conflicts.length >= 10) break;
        }
        return res.status(409).json({
          message: 'Conflict: one or more selected games are already assigned to one or more of these classes during the chosen time window. Please cancel/complete the existing assignment or adjust dates/classes.',
          conflicts,
        });
      }
    }

    // Resolve target students (snapshot from selected classes)
    let targetStudentIds = [];
    const classes = await Class.find({ _id: { $in: classIds } }).select('enrolledStudents');
    for (const c of classes) {
      const list = Array.isArray(c.enrolledStudents) ? c.enrolledStudents : [];
      for (const e of list) {
        if (e && e.studentId) targetStudentIds.push(e.studentId.toString());
      }
    }

    // Ensure uniqueness
    const uniqueStudentIds = [...new Set(targetStudentIds.map((id) => id.toString()))];

    const assignment = await Assignment.create({
  title,
  description,
      gameCreations,
      startDate,
      endDate,
      attemptLimit: Number.isInteger(attemptLimit) ? attemptLimit : undefined,
  students: uniqueStudentIds,
      classes: Array.isArray(classIds) ? classIds : [],
      teacher: req.user._id,
    });

    if (assignment) {
      res.status(201).json(assignment);
    } else {
      res.status(400).json({ message: 'Invalid assignment data.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all assignments for the logged-in student
// @route   GET /api/assignments/my-assignments
// @access  Private/Student
const getMyAssignments = async (req, res) => {
  try {
    const userId = req.user._id;
    // Determine current class memberships for the student
    const myClasses = await Class.find({ 'enrolledStudents.studentId': userId }).select('_id');
    const myClassIds = myClasses.map(c => c._id.toString());
    // Match assignments explicitly listing the student OR targeting any of the student's classes
    const baseQuery = myClassIds.length
      ? { $or: [ { students: userId }, { classes: { $in: myClassIds } } ] }
      : { students: userId };
    const assignments = await Assignment.find(baseQuery);
    const refreshed = assignments.map(a => {
      const obj = a.toObject();
      obj.status = computeStatusFromDates(a.startDate, a.endDate, obj.status);
      return obj;
    });
    res.status(200).json(refreshed);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
// @desc    Get all assignments created by the logged-in teacher
// @route   GET /api/assignments/teacher
// @access  Private/Teacher
const getAssignmentsForTeacher = async (req, res) => {
  try {
  const { page, limit, status } = req.query;
    const teacherOnly = { teacher: req.user._id };
    const now = new Date();
    if (status && status !== 'all') {
      // filter will apply below; first compute counts independent of filter
    }

    // Counts independent of the current filter to avoid flicker/flip
    const [activeCount, upcomingCount, completedCount, canceledCount, totalAll] = await Promise.all([
      // Active: within window and not canceled/completed
      Assignment.countDocuments({ ...teacherOnly, startDate: { $lte: now }, endDate: { $gte: now }, status: { $nin: ['canceled', 'completed'] } }),
      // Upcoming: starts in future and not canceled/completed
      Assignment.countDocuments({ ...teacherOnly, startDate: { $gt: now }, status: { $nin: ['canceled', 'completed'] } }),
      // Completed: explicitly marked completed OR past due (and not canceled)
      Assignment.countDocuments({ ...teacherOnly, $or: [ { status: 'completed' }, { endDate: { $lt: now }, status: { $ne: 'canceled' } } ] }),
      // Canceled
      Assignment.countDocuments({ ...teacherOnly, status: 'canceled' }),
      Assignment.countDocuments(teacherOnly),
    ]);
    const counts = { active: activeCount, upcoming: upcomingCount, completed: completedCount, canceled: canceledCount, total: totalAll };

    const baseQuery = { ...teacherOnly };
    if (status && status !== 'all') {
      if (status === 'active') {
        baseQuery.status = { $nin: ['canceled', 'completed'] };
        baseQuery.startDate = { $lte: now };
        baseQuery.endDate = { $gte: now };
      } else if (status === 'upcoming') {
        baseQuery.status = { $nin: ['canceled', 'completed'] };
        baseQuery.startDate = { $gt: now };
      } else if (status === 'completed') {
        // completed (computed): explicitly completed OR endDate < now AND not canceled
        baseQuery.$or = [ { status: 'completed' }, { endDate: { $lt: now }, status: { $ne: 'canceled' } } ];
      } else if (status === 'canceled') {
        baseQuery.status = 'canceled';
      }
    }

    // If no pagination requested, return the full array for backward compatibility
    if (!page || !limit) {
      const list = await Assignment.find(baseQuery)
        .sort({ createdAt: -1 })
        .populate('classes', 'name');
      const refreshed = list.map(a => {
        const obj = a.toObject();
        obj.status = computeStatusFromDates(a.startDate, a.endDate, obj.status);
        return obj;
      });
      return res.status(200).json({ items: refreshed, total: refreshed.length, counts });
    }

    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(50, Math.max(1, parseInt(limit)));
    const total = await Assignment.countDocuments(baseQuery);
    const list = await Assignment.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip((pg - 1) * lim)
      .limit(lim)
      .populate('classes', 'name');
    const items = list.map(a => {
      const obj = a.toObject();
      obj.status = computeStatusFromDates(a.startDate, a.endDate, obj.status);
      return obj;
    });
    res.json({ page: pg, limit: lim, total, items, counts });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports.getAssignmentsForTeacher = getAssignmentsForTeacher;

// @desc    Get detailed assignments with progress & filtering
// @route   GET /api/assignments/my-assignments/detailed?classId=&status=&page=&limit=
// @access  Private/Student
const getMyAssignmentsDetailed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { classId, status = 'all', page = 1, limit = 10 } = req.query;
    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(50, Math.max(1, parseInt(limit)));

  // Classes the student belongs to
  const myClasses = await Class.find({ 'enrolledStudents.studentId': userId }).select('_id');
    const myClassIds = myClasses.map(c => c._id.toString());

    // Base query (match student direct OR class membership)
    const orConditions = [ { students: userId } ];
    if (myClassIds.length) orConditions.push({ classes: { $in: myClassIds } });
    const baseQuery = { $or: orConditions };
    if (classId && myClassIds.includes(classId)) {
      // Narrow to assignments involving this class or explicitly listing student
      baseQuery.$and = [ { $or: [ { classes: classId }, { students: userId } ] } ];
    }

  // Fetch assignments (lean for performance)
  const assignments = await Assignment.find(baseQuery).lean();

    const now = Date.now();
    const detailed = [];
    // Pre-batch fetch all game results for these assignments to avoid N queries
    const assignmentIds = assignments.map(a => a._id);
    const allResults = await GameResult.find({ student: userId, assignment: { $in: assignmentIds } })
      .select('assignment gameCreation score totalPossibleScore')
      .lean();
    // Group results by assignment for quick lookup
    const byAssignment = new Map();
    for (const r of allResults) {
      const key = r.assignment.toString();
      if (!byAssignment.has(key)) byAssignment.set(key, []);
      byAssignment.get(key).push(r);
    }

    for (const a of assignments) {
      // Derive current status (trust field but recompute if needed for dueSoon)
  let aStatus = computeStatusFromDates(a.startDate, a.endDate, a.status);
      const dueSoon = aStatus === 'active' && a.endDate && (new Date(a.endDate).getTime() - now) < 1000 * 60 * 60 * 48; // 48h

      // Progress metrics
      const gameIds = (a.gameCreations || []).map(id => id.toString());
      let completed = 0;
      let averagePercent = 0;
      if (gameIds.length) {
        const results = byAssignment.get(a._id.toString()) || [];
        if (results.length) {
          const byGameAttempts = new Map();
          const byGameBestPct = new Map();
          for (const r of results) {
            if (!gameIds.includes(r.gameCreation.toString())) continue;
            const key = r.gameCreation.toString();
            byGameAttempts.set(key, (byGameAttempts.get(key) || 0) + 1);
            const pct = r.totalPossibleScore > 0 ? (r.score / r.totalPossibleScore) * 100 : 0;
            if (!byGameBestPct.has(key) || pct > byGameBestPct.get(key)) byGameBestPct.set(key, pct);
          }
          // Only count as completed if attemptLimit reached for that game
          completed = 0;
          for (const key of gameIds) {
            const attempts = byGameAttempts.get(key) || 0;
            if (a.attemptLimit && attempts >= a.attemptLimit) completed++;
          }
          if (byGameBestPct.size) {
            averagePercent = Array.from(byGameBestPct.values()).reduce((acc,v)=>acc+v,0)/byGameBestPct.size;
          }
        }
      }
      const totalGames = gameIds.length;
      const completionPercent = totalGames ? Math.round((completed / totalGames) * 100) : 0;

      // Status filter check
      let include = true;
      if (status !== 'all') {
        if (status === 'dueSoon') include = dueSoon; else include = aStatus === status;
      }
      if (!include) continue;

      detailed.push({
        _id: a._id,
        title: a.title,
        description: a.description || '',
        startDate: a.startDate,
        endDate: a.endDate,
        status: aStatus,
        dueSoon,
  attemptLimit: a.attemptLimit,
        classIds: (a.classes || []).map(c => c.toString()),
        progress: {
          completed,
          totalGames,
          completionPercent,
          averagePercent: Math.round(averagePercent),
        }
      });
    }

  // Sort: active > upcoming > completed, then dueSoon within active, then nearest endDate
  const statusRank = { active: 0, dueSoon: 0, upcoming: 1, completed: 2 };
    detailed.sort((a,b) => {
      const ar = statusRank[a.dueSoon ? 'dueSoon' : a.status] ?? 3;
      const br = statusRank[b.dueSoon ? 'dueSoon' : b.status] ?? 3;
      if (ar !== br) return ar - br;
      return new Date(a.endDate) - new Date(b.endDate);
    });

    // Compute nextGameId for each assignment (first uncompleted game id order given)
    for (const d of detailed) {
      const original = assignments.find(a => a._id.toString() === d._id.toString());
      if (original && original.gameCreations && original.gameCreations.length) {
        const seq = original.gameCreations.map(id => id.toString());
        const results = byAssignment.get(d._id.toString()) || [];
        // For each game, check if its attempt limit is reached
        let nextGameId = null;
        let nextGameAttemptsRemaining = null;
        for (const gameId of seq) {
          const attempts = results.filter(r => r.gameCreation.toString() === gameId).length;
          if (!original.attemptLimit || attempts < original.attemptLimit) {
            nextGameId = gameId;
            nextGameAttemptsRemaining = Math.max(0, original.attemptLimit - attempts);
            break;
          }
        }
        if (nextGameId) {
          d.nextGameId = nextGameId;
          d.nextGameAttemptsRemaining = nextGameAttemptsRemaining;
          console.log(`[DEBUG] Assignment ${d._id} nextGameId=${nextGameId} nextAttempts=${original.attemptLimit - nextGameAttemptsRemaining} attemptLimit=${original.attemptLimit} nextGameAttemptsRemaining=${nextGameAttemptsRemaining}`);
        }
      }
    }
    const total = detailed.length;
    const start = (pg - 1) * lim;
    const pageItems = detailed.slice(start, start + lim);

    res.json({ page: pg, limit: lim, total, items: pageItems });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get detailed breakdown for a single assignment (per game attempts/progress)
// @route   GET /api/assignments/:id/breakdown
// @access  Private/Student
const getAssignmentBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;
    const assignmentId = req.params.id;
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    // Authorization: ensure user is target either directly or via class membership
  const classCount = await Class.countDocuments({ _id: { $in: assignment.classes }, 'enrolledStudents.studentId': userId });
    const direct = assignment.students.map(s=>s.toString()).includes(userId.toString());
    if (!direct && classCount === 0) return res.status(403).json({ message: 'Not allowed' });

    const gameIds = (assignment.gameCreations || []).map(id => id.toString());
  const games = await GameCreation.find({ _id: { $in: gameIds } }).select('_id name template').lean();
    const results = await GameResult.find({ student: userId, assignment: assignment._id, gameCreation: { $in: gameIds } }).lean();
    const grouped = {};
    for (const g of games) {
  grouped[g._id.toString()] = { gameId: g._id, name: g.name, templateId: g.template, attempts: [], bestPercent: 0, attemptCount: 0 };
    }
    for (const r of results) {
      const key = r.gameCreation.toString();
      if (!grouped[key]) continue;
      const pct = r.totalPossibleScore > 0 ? (r.score / r.totalPossibleScore) * 100 : 0;
      grouped[key].attempts.push({ attemptNumber: r.attemptNumber, score: r.score, totalPossibleScore: r.totalPossibleScore, percent: Math.round(pct) });
      if (pct > grouped[key].bestPercent) grouped[key].bestPercent = pct;
    }
    const breakdown = Object.values(grouped).map(g => ({
      ...g,
      attemptCount: g.attempts.length,
      bestPercent: Math.round(g.bestPercent),
      attempts: g.attempts.sort((a,b)=>a.attemptNumber - b.attemptNumber)
    }));

  res.json({
      _id: assignment._id,
      title: assignment.title,
      attemptLimit: assignment.attemptLimit,
      games: breakdown
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update an assignment (teacher-only, must own)
// @route   PUT /api/assignments/:id
// @access  Private/Teacher
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Assignment.findById(id);
    if (!a) return res.status(404).json({ message: 'Assignment not found' });
    if (req.user.role !== 'teacher' || a.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
  const { title, description, startDate, endDate, attemptLimit } = req.body;
    if (title !== undefined) a.title = title;
  if (description !== undefined) a.description = description;
    if (startDate !== undefined) a.startDate = new Date(startDate);
    if (endDate !== undefined) a.endDate = new Date(endDate);
    if (attemptLimit !== undefined) a.attemptLimit = attemptLimit;
    await a.save();
    res.json(a);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Delete an assignment (teacher-only, must own)
// @route   DELETE /api/assignments/:id
// @access  Private/Teacher
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Assignment.findById(id);
    if (!a) return res.status(404).json({ message: 'Assignment not found' });
    if (req.user.role !== 'teacher' || a.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
  const statusNow = computeStatusFromDates(a.startDate, a.endDate, a.status);
  if (statusNow === 'active') return res.status(400).json({ message: 'Active assignments cannot be deleted.' });
  await a.deleteOne();
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Cancel an assignment (teacher-only, must own)
// @route   POST /api/assignments/:id/cancel
// @access  Private/Teacher
const cancelAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Assignment.findById(id);
    if (!a) return res.status(404).json({ message: 'Assignment not found' });
    if (req.user.role !== 'teacher' || a.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (a.status === 'canceled') return res.status(200).json(a);

    // If time already passed, mark as completed
    const now = Date.now();
    if (a.endDate && now >= new Date(a.endDate).getTime()) {
      a.status = 'completed';
      a.completedAt = new Date();
      await a.save();
      return res.json(a);
    }

    // If active, permit cancel only if completion < 50%
    const statusNow = computeStatusFromDates(a.startDate, a.endDate, a.status);
    if (statusNow === 'active') {
      // compute completion percent: targeted students with >=1 counted attempt for all games
      const gameIds = (a.gameCreations || []).map(id => id.toString());
      const studentIds = (a.students || []).map(s => s.toString());
      let completionPercent = 0;
      if (studentIds.length && gameIds.length) {
        const results = await GameResult.find({ assignment: a._id, counted: true, gameCreation: { $in: gameIds }, student: { $in: studentIds } }).select('student gameCreation').lean();
        const byStudent = new Map();
        for (const r of results) {
          const k = r.student.toString();
          if (!byStudent.has(k)) byStudent.set(k, new Set());
          byStudent.get(k).add(r.gameCreation.toString());
        }
        let done = 0;
        for (const sid of studentIds) {
          const set = byStudent.get(sid);
          if (set && set.size >= gameIds.length) done++;
        }
        completionPercent = Math.round((done / studentIds.length) * 100);
      }
      if (completionPercent >= 50) {
        return res.status(400).json({ message: 'Cannot cancel: completion >= 50%.' });
      }
    }

    a.status = 'canceled';
    a.canceledAt = new Date();
    await a.save();
    res.json(a);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Mark an assignment as completed (teacher-only, must own)
// @route   POST /api/assignments/:id/complete
// @access  Private/Teacher
const completeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Assignment.findById(id);
    if (!a) return res.status(404).json({ message: 'Assignment not found' });
    if (req.user.role !== 'teacher' || a.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (a.status === 'canceled') return res.status(400).json({ message: 'Assignment is canceled' });
    if (a.status === 'completed') return res.status(200).json(a);
    a.status = 'completed';
    a.completedAt = new Date();
    a.completedBy = req.user._id;
    await a.save();
    res.json(a);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Export functions once at top-level
module.exports = {
  createAssignment,
  getMyAssignments,
  getAssignmentsForTeacher,
  getMyAssignmentsDetailed,
  getAssignmentBreakdown,
  updateAssignment,
  deleteAssignment,
  cancelAssignment,
  completeAssignment,
  getCanAttempt,
};

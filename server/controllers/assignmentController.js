// server/controllers/assignmentController.js

const Assignment = require('../models/Assignment');
const User = require('../models/User'); // We need the User model to find students
const Class = require('../models/Class');
const GameResult = require('../models/GameResult');
const GameCreation = require('../models/GameCreation');

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private/Teacher
const createAssignment = async (req, res) => {
  try {
  const { title, gameCreations, startDate, endDate, classIds, studentIds: explicitStudentIds, attemptLimit } = req.body;

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

    // Resolve target students
    let targetStudentIds = Array.isArray(explicitStudentIds) ? [...explicitStudentIds] : [];

    if (Array.isArray(classIds) && classIds.length > 0) {
      const classes = await Class.find({ _id: { $in: classIds } }).select('students');
      for (const c of classes) {
        for (const s of c.students) targetStudentIds.push(s.toString());
      }
    }

    // Fallback: if still empty, assign to all students in the teacher's school
    if (targetStudentIds.length === 0) {
      const students = await User.find({ role: 'student', school: req.user.school }).select('_id');
      targetStudentIds = students.map((s) => s._id);
    }

    // Ensure uniqueness
    const uniqueStudentIds = [...new Set(targetStudentIds.map((id) => id.toString()))];

    const assignment = await Assignment.create({
      title,
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
    // Find all assignments where the 'students' array contains the logged-in user's ID
    const assignments = await Assignment.find({ students: req.user._id });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createAssignment,
  getMyAssignments,
};
// @desc    Get all assignments created by the logged-in teacher
// @route   GET /api/assignments/teacher
// @access  Private/Teacher
const getAssignmentsForTeacher = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports.getAssignmentsForTeacher = getAssignmentsForTeacher;

// @desc    Get detailed assignments with progress & filtering
// @route   GET /api/assignments/my-assignments/detailed?classId=&status=&page=&limit=
// @access  Private/Student
module.exports.getMyAssignmentsDetailed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { classId, status = 'all', page = 1, limit = 10 } = req.query;
    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(50, Math.max(1, parseInt(limit)));

    // Classes the student belongs to
    const myClasses = await Class.find({ students: userId }).select('_id');
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
      let aStatus = a.status;
      if (a.startDate && a.endDate) {
        const start = new Date(a.startDate).getTime();
        const end = new Date(a.endDate).getTime();
        if (now < start) aStatus = 'upcoming'; else if (now > end) aStatus = 'closed'; else aStatus = 'active';
      }
      const dueSoon = aStatus === 'active' && a.endDate && (new Date(a.endDate).getTime() - now) < 1000 * 60 * 60 * 48; // 48h

      // Progress metrics
      const gameIds = (a.gameCreations || []).map(id => id.toString());
      let completed = 0;
      let averagePercent = 0;
      if (gameIds.length) {
        const results = byAssignment.get(a._id.toString()) || [];
        if (results.length) {
          const byGame = new Map();
          for (const r of results) {
            if (!gameIds.includes(r.gameCreation.toString())) continue;
            const key = r.gameCreation.toString();
            const pct = r.totalPossibleScore > 0 ? (r.score / r.totalPossibleScore) * 100 : 0;
            if (!byGame.has(key) || pct > byGame.get(key)) byGame.set(key, pct);
          }
          completed = byGame.size;
          if (byGame.size) {
            averagePercent = Array.from(byGame.values()).reduce((acc,v)=>acc+v,0)/byGame.size;
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

    // Sort: active > upcoming > closed, then dueSoon within active, then nearest endDate
    const statusRank = { active: 0, dueSoon: 0, upcoming: 1, closed: 2 };
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
        const attemptedGameIds = new Set(results.map(r => r.gameCreation.toString()));
        const next = seq.find(id => !attemptedGameIds.has(id));
        if (next) {
          d.nextGameId = next;
          if (d.attemptLimit && d.attemptLimit > 1) {
            const nextAttempts = results.filter(r => r.gameCreation.toString() === next).length;
            d.nextGameAttemptsRemaining = Math.max(0, d.attemptLimit - nextAttempts);
          }
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
module.exports.getAssignmentBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;
    const assignmentId = req.params.id;
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    // Authorization: ensure user is target either directly or via class membership
    const classCount = await Class.countDocuments({ _id: { $in: assignment.classes }, students: userId });
    const direct = assignment.students.map(s=>s.toString()).includes(userId.toString());
    if (!direct && classCount === 0) return res.status(403).json({ message: 'Not allowed' });

    const gameIds = (assignment.gameCreations || []).map(id => id.toString());
    const games = await GameCreation.find({ _id: { $in: gameIds } }).select('_id name template').lean();
    const results = await GameResult.find({ student: userId, assignment: assignment._id, gameCreation: { $in: gameIds } }).lean();
    const grouped = {};
    for (const g of games) {
      grouped[g._id.toString()] = { gameId: g._id, name: g.name, attempts: [], bestPercent: 0, attemptCount: 0 };
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

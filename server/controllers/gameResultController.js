// server/controllers/gameResultController.js

const GameResult = require('../models/GameResult');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const GameCreation = require('../models/GameCreation');
// Legacy global badge system removed
const { evaluateTemplateBadgeForResult } = require('./templateBadgeController');

// @desc    Submit a result for a game
// @route   POST /api/results
// @access  Private/Student
const submitGameResult = async (req, res) => {
  try {
  const { gameCreationId, score, totalPossibleScore, assignmentId, isTest: isTestFromClient } = req.body;
  const studentId = req.user._id;

    if (!gameCreationId || score === undefined || totalPossibleScore === undefined) {
      return res.status(400).json({ message: 'Missing required result data.' });
    }

  // Load creation to read policy/xp snapshot
  const creation = await GameCreation.findById(gameCreationId).populate('template');
  if (!creation) return res.status(404).json({ message: 'Game creation not found.' });

  // If this is a teacher/admin test run, don't persist or require assignment.
  if ((req.user.role && req.user.role !== 'student') || isTestFromClient) {
    return res.status(201).json({
      message: 'Test run received (not recorded).',
      counted: false,
      isTest: true,
    });
  }

  let assignment;
    if (assignmentId) {
      assignment = await Assignment.findOne({ _id: assignmentId, gameCreations: gameCreationId });
    } else {
      // Fallback: any assignment referencing this game where user is direct student or member via class
      assignment = await Assignment.findOne({
        gameCreations: gameCreationId,
        $or: [ { students: studentId }, { classes: { $exists: true, $ne: [] } } ]
      });
      // If found via class membership ensure membership
      if (assignment && !assignment.students.map(s=>s.toString()).includes(studentId.toString())) {
        // Verify class membership
        const Class = require('../models/Class');
        const classCount = await Class.countDocuments({ _id: { $in: assignment.classes }, students: studentId });
        if (classCount === 0) assignment = null;
      }
    }

    if (!assignment) {
      return res.status(404).json({ message: 'No active assignment found for this game.' });
    }

    // Count previous attempts for this assignment/game
    const previousAttempts = await GameResult.find({
      student: studentId,
      gameCreation: gameCreationId,
      assignment: assignment._id,
    }).sort({ createdAt: 1 });

    const attemptLimit = assignment.attemptLimit || 1;
    if (previousAttempts.length >= attemptLimit) {
      return res.status(400).json({ message: 'Attempt limit reached for this assignment.' });
    }

  const attemptNumber = previousAttempts.length + 1;

  // Determine counted based on creation policy (first_only) and if a prior counted exists
  const hasCounted = previousAttempts.some(r => r.counted);
  const firstOnly = (creation.attemptPolicy || 'first_only') === 'first_only';
  const counted = firstOnly ? !hasCounted : true;

  // Determine if this is a test run (teacher/admin/hotspot) - trusted over client flag
  const isTest = (req.user.role !== 'student') || !!isTestFromClient;

    // XP policy
    let xpAwarded = 0;
    if (!isTest && counted) {
      // assignment mode: honor creation.xp.assignment
      const xpConf = creation.xp?.assignment || { enabled: true, amount: 0, firstAttemptOnly: true };
      if (xpConf.enabled) xpAwarded = Number(xpConf.amount || 0);
    }

    const gameResult = await GameResult.create({
      student: studentId,
      gameCreation: gameCreationId,
      assignment: assignment._id,
      score,
      totalPossibleScore,
      attemptNumber,
      counted,
      isTest,
      xpAwarded,
    });

    // --- Update student's XP and points ---
  const percentage = totalPossibleScore > 0 ? Math.round((score / totalPossibleScore) * 100) : 0;
  const pointsEarned = score; // raw score as points

    const user = await User.findById(studentId);
    if (user) {
      // Only add xpAwarded, not percentage-based anymore
      user.xp = (user.xp || 0) + (xpAwarded || 0);
      user.totalPoints = (user.totalPoints || 0) + pointsEarned;

      // Simple level-up: every 500 XP -> +1 level
      const newLevel = 1 + Math.floor((user.xp || 0) / 500);
      user.level = Math.max(user.level || 1, newLevel);
      await user.save();
    }

  // New per-template tiered badge evaluation
    if (!isTest && counted) {
      evaluateTemplateBadgeForResult({ userId: studentId, gameCreationId, percentage });
    }

    res.status(201).json({ 
      message: 'Result submitted successfully!', 
      result: gameResult,
  xpAwarded,
      pointsEarned,
  percentage,
  attemptNumber,
  attemptsRemaining: Math.max(0, attemptLimit - attemptNumber),
  counted,
  isTest,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get attempt history for a specific assignment/game pair
// @route   GET /api/results/history/:assignmentId/:gameCreationId
// @access  Private/Student
const getAttemptHistory = async (req, res) => {
  try {
    const { assignmentId, gameCreationId } = req.params;
    const studentId = req.user._id;
    const results = await GameResult.find({ assignment: assignmentId, gameCreation: gameCreationId, student: studentId })
      .sort({ createdAt: 1 })
      .select('score totalPossibleScore attemptNumber createdAt');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Get all results for a specific game creation
// @route   GET /api/results/:gameCreationId
// @access  Private/Teacher
const getResultsForGame = async (req, res) => {
  try {
    // We use .populate('student', 'name') to replace the student's ObjectId
    // with their actual document, but we only select the 'name' field.
    const results = await GameResult.find({ gameCreation: req.params.gameCreationId })
      .populate('student', 'name');

    // We can add a security check here later to ensure the user requesting
    // the results is the teacher who owns the game creation.

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


module.exports = {
  submitGameResult,
  getResultsForGame, // NEW: Export the new function
  getAttemptHistory,
};

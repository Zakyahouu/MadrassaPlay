// server/controllers/gameResultController.js

const GameResult = require('../models/GameResult');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
// Legacy global badge system removed
const { evaluateTemplateBadgeForResult } = require('./templateBadgeController');

// @desc    Submit a result for a game
// @route   POST /api/results
// @access  Private/Student
const submitGameResult = async (req, res) => {
  try {
  const { gameCreationId, score, totalPossibleScore, assignmentId } = req.body;
    const studentId = req.user._id;

    if (!gameCreationId || score === undefined || totalPossibleScore === undefined) {
      return res.status(400).json({ message: 'Missing required result data.' });
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

    const gameResult = await GameResult.create({
      student: studentId,
      gameCreation: gameCreationId,
      assignment: assignment._id,
      score,
      totalPossibleScore,
      attemptNumber,
    });

    // --- Update student's XP and points ---
    const percentage = totalPossibleScore > 0 ? Math.round((score / totalPossibleScore) * 100) : 0;
    const xpEarned = Math.max(5, Math.min(percentage, 100)); // 5-100 XP per game
    const pointsEarned = score; // raw score as points

    const user = await User.findById(studentId);
    if (user) {
      user.xp = (user.xp || 0) + xpEarned;
      user.totalPoints = (user.totalPoints || 0) + pointsEarned;

      // Simple level-up: every 500 XP -> +1 level
      const newLevel = 1 + Math.floor((user.xp || 0) / 500);
      user.level = Math.max(user.level || 1, newLevel);
      await user.save();
    }

  // New per-template tiered badge evaluation
  evaluateTemplateBadgeForResult({ userId: studentId, gameCreationId, percentage });

    res.status(201).json({ 
      message: 'Result submitted successfully!', 
      result: gameResult,
      xpEarned,
      pointsEarned,
  percentage,
  attemptNumber,
  attemptsRemaining: Math.max(0, attemptLimit - attemptNumber),
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

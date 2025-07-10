// server/controllers/gameResultController.js

const GameResult = require('../models/GameResult');
const Assignment = require('../models/Assignment');

// @desc    Submit a result for a game
// @route   POST /api/results
// @access  Private/Student
const submitGameResult = async (req, res) => {
  try {
    const { gameCreationId, score, totalPossibleScore } = req.body;
    const studentId = req.user._id;

    if (!gameCreationId || score === undefined || totalPossibleScore === undefined) {
      return res.status(400).json({ message: 'Missing required result data.' });
    }

    const assignment = await Assignment.findOne({
      gameCreations: gameCreationId,
      students: studentId,
    });

    if (!assignment) {
      return res.status(404).json({ message: 'No active assignment found for this game.' });
    }

    const existingResult = await GameResult.findOne({
        student: studentId,
        gameCreation: gameCreationId,
        assignment: assignment._id,
    });

    if (existingResult) {
        return res.status(400).json({ message: 'You have already submitted a result for this game.' });
    }

    const gameResult = await GameResult.create({
      student: studentId,
      gameCreation: gameCreationId,
      assignment: assignment._id,
      score,
      totalPossibleScore,
    });

    res.status(201).json({ message: 'Result submitted successfully!', result: gameResult });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
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
};

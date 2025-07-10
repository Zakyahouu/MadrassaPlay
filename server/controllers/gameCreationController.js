// server/controllers/gameCreationController.js

const GameCreation = require('../models/GameCreation');
const Assignment = require('../models/Assignment'); // 1. Import the Assignment model

// @desc    Create a new game creation
// @route   POST /api/creations
// @access  Private/Teacher
const createGameCreation = async (req, res) => {
  try {
    const { template, name, config } = req.body;
    if (!template || !name || !config) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const gameCreation = await GameCreation.create({
      template,
      name,
      config,
      owner: req.user._id,
    });
    if (gameCreation) {
      res.status(201).json(gameCreation);
    } else {
      res.status(400).json({ message: 'Invalid game creation data.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all game creations for the logged-in teacher
// @route   GET /api/creations
// @access  Private/Teacher
const getMyGameCreations = async (req, res) => {
  try {
    const creations = await GameCreation.find({ owner: req.user._id });
    res.status(200).json(creations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single game creation by ID
// @route   GET /api/creations/:id
// @access  Private
const getGameCreationById = async (req, res) => {
  try {
    const creation = await GameCreation.findById(req.params.id);

    if (creation) {
      // --- NEW: Updated Security Check ---
      const isOwner = creation.owner.toString() === req.user._id.toString();
      
      // If the user is not the owner, check if they are a student assigned to this game.
      if (!isOwner && req.user.role === 'student') {
        const assignment = await Assignment.findOne({
          gameCreations: req.params.id, // Find an assignment containing this game
          students: req.user._id,      // And where the student is in the students list
        });

        // If no such assignment is found, the student is not authorized.
        if (!assignment) {
          return res.status(403).json({ message: 'Not authorized to access this game.' });
        }
      } else if (!isOwner) {
        // If the user is not the owner and not a student, they are not authorized.
        return res.status(403).json({ message: 'Not authorized to access this game.' });
      }
      
      // If the checks pass, send the game data.
      res.status(200).json(creation);

    } else {
      res.status(404).json({ message: 'Game creation not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createGameCreation,
  getMyGameCreations,
  getGameCreationById,
};

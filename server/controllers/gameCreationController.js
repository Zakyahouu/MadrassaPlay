// server/controllers/gameCreationController.js

const GameCreation = require('../models/GameCreation');
const Assignment = require('../models/Assignment');

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
      const isOwner = creation.owner.toString() === req.user._id.toString();
      
      if (isOwner) {
        return res.status(200).json(creation);
      }
      
      if (req.user.role === 'student') {
        // Check 1: Is the student in an active live game for this creation?
        const liveGames = req.liveGames; // Get live games from the request object
        const activeGame = Object.values(liveGames).find(
          game => game.gameCreationId === req.params.id && 
                  game.players.some(player => player.userId === req.user._id.toString())
        );

        if (activeGame) {
          return res.status(200).json(creation);
        }

        // Check 2: Is the student assigned this game for homework?
        const assignment = await Assignment.findOne({
          gameCreations: req.params.id,
          students: req.user._id,
        });

        if (assignment) {
          return res.status(200).json(creation);
        }
      }
      
      // If none of the above conditions are met, deny access.
      return res.status(403).json({ message: 'Not authorized to access this game.' });

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

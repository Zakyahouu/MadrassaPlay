// server/controllers/gameCreationController.js
const asyncHandler = require('express-async-handler');
const GameCreation = require('../models/GameCreation');
const GameTemplate = require('../models/GameTemplate');
const Assignment = require('../models/Assignment');

// @desc    Create a new game creation
// @route   POST /api/creations
// @access  Private/Teacher or Admin
const createGameCreation = asyncHandler(async (req, res) => {
  const { template: templateId, settings, content } = req.body;

  // --- THIS IS THE FIX ---
  // We extract the data and map it to the correct field names required by the model.
  const name = settings?.title; // The model expects 'name', which comes from the form's 'title' setting.
  const owner = req.user._id; // The model expects 'owner', which is the logged-in user's ID.
  const config = settings; // The model expects 'config', which is our entire settings object.

  if (!templateId || !config || !content || !name) {
    res.status(400);
    throw new Error('Please provide all required fields, including a title.');
  }

  const template = await GameTemplate.findById(templateId);
  if (!template) {
    res.status(404);
    throw new Error('Game template not found');
  }
  
  // Data processing for numbers (from our previous fix)
  const processedConfig = { ...config };
    Object.entries(template.formSchema.settings).forEach(([key, schema]) => {
    if (schema.type === 'number' && processedConfig[key] !== undefined) {
        processedConfig[key] = parseInt(processedConfig[key], 10);
        if (isNaN(processedConfig[key])) processedConfig[key] = 0;
    }
  });

  const processedContent = content.map(item => {
    const processedItem = { ...item };
    if (template.formSchema.content && template.formSchema.content.itemSchema) {
        Object.entries(template.formSchema.content.itemSchema).forEach(([key, schema]) => {
            if (schema.type === 'number' && processedItem[key] !== undefined) {
                processedItem[key] = parseInt(processedItem[key], 10);
                if (isNaN(processedItem[key])) processedItem[key] = 0;
            }
        });
    }
    return processedItem;
  });


  const gameCreation = await GameCreation.create({
    name,
    owner,
    config: processedConfig,
    content: processedContent,
    template: templateId,
    // Note: The 'teacher' field from the model is now named 'owner'
  });

  if (gameCreation) {
    res.status(201).json(gameCreation);
  } else {
    res.status(400);
    throw new Error('Invalid game creation data');
  }
});


// @desc    Get all game creations for the logged-in user
// @route   GET /api/creations
// @access  Private/Teacher or Admin
const getMyGameCreations = asyncHandler(async (req, res) => {
  // Use 'owner' instead of 'teacher' to match the updated model
  const creations = await GameCreation.find({ owner: req.user._id })
    .populate('template', 'name')
    .sort({ createdAt: -1 });
  res.json(creations);
});

// @desc    Get a single game creation by ID
// @route   GET /api/creations/:id
// @access  Private
const getGameCreationById = asyncHandler(async (req, res) => {
    const gameCreation = await GameCreation.findById(req.params.id)
        .populate('template');

    if (!gameCreation) {
        res.status(404);
        throw new Error('Game creation not found');
    }

    const isOwner = gameCreation.owner.toString() === req.user._id.toString();
    
    const isAssignedStudent = await Assignment.findOne({
        students: req.user._id,
        gameCreations: req.params.id,
    });

    let isInLiveGame = false;
    if (req.liveGames) {
      for (const roomCode in req.liveGames) {
        const room = req.liveGames[roomCode];
        if (room.gameId === req.params.id && room.players.some(p => p.id === req.user._id.toString())) {
          isInLiveGame = true;
          break;
        }
      }
    }

    if (isOwner || (req.user.role === 'student' && (isAssignedStudent || isInLiveGame))) {
        res.json(gameCreation);
    } else {
        res.status(403);
        throw new Error('User not authorized to access this game');
    }
});


// @desc    Delete a game creation
// @route   DELETE /api/creations/:id
// @access  Private/Owner
const deleteGameCreation = asyncHandler(async (req, res) => {
    const gameCreation = await GameCreation.findById(req.params.id);

    if (!gameCreation) {
        res.status(404);
        throw new Error('Game creation not found');
    }

    if (gameCreation.owner.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('User not authorized to delete this game');
    }

    await gameCreation.deleteOne();
    res.json({ message: 'Game creation removed' });
});


module.exports = {
  createGameCreation,
  getMyGameCreations,
  getGameCreationById,
  deleteGameCreation,
};

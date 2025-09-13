// server/controllers/gameCreationController.js
const asyncHandler = require('express-async-handler');
const GameCreation = require('../models/GameCreation');
const GameTemplate = require('../models/GameTemplate');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');

// @desc    Create a new game creation
// @route   POST /api/creations
// @access  Private/Teacher or Admin
const createGameCreation = asyncHandler(async (req, res) => {
  const { template: templateId, config, content, levelLabel, levelId } = req.body;

  const owner = req.user._id; // The model expects 'owner', which is the logged-in user's ID.

  if (!templateId || !config) {
    res.status(400);
    throw new Error('Missing template or config.');
  }

  // Load template first (needed for fallback name and policy/xp snapshot)
  const template = await GameTemplate.findById(templateId);
  // Enforce max creations per teacher per template (manifest.limits.maxCreationsPerTeacher)
  const maxCreations = Number(template.manifest?.limits?.maxCreationsPerTeacher || 0);
  if (maxCreations > 0) {
    const count = await GameCreation.countDocuments({ owner, template: templateId });
    if (count >= maxCreations) {
      res.status(400);
      throw new Error(`Creation limit reached for this template (${maxCreations}).`);
    }
  }
  if (!template) {
    res.status(404);
    throw new Error('Game template not found');
  }

  // Extract optional title from config
  const name = config?.title;
  // Allow name fallback if not explicitly provided
  let finalName = name;
  if (!finalName) {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    finalName = `Game - ${template.name}-${ts}`;
  }
  
  // Data processing for numbers (from our previous fix)
  const processedConfig = { ...config };
    Object.entries(template.formSchema.settings).forEach(([key, schema]) => {
    if (schema.type === 'number' && processedConfig[key] !== undefined) {
        processedConfig[key] = parseInt(processedConfig[key], 10);
        if (isNaN(processedConfig[key])) processedConfig[key] = 0;
    }
  });

  // Validate content requirement depending on schema and autoGenerate flag
  const hasContentSchema = !!template.formSchema?.content;
  const minItems = hasContentSchema ? (template.formSchema.content.minItems ?? 1) : 0;
  const hasAutoSetting = !!template.formSchema?.settings && Object.prototype.hasOwnProperty.call(template.formSchema.settings, 'autoGenerate');
  const autoSelected = !!config.autoGenerate;

  if (hasContentSchema && !autoSelected && minItems > 0) {
    if (!Array.isArray(content) || content.length < minItems) {
      res.status(400);
      throw new Error(`Please add at least ${minItems} content item(s).`);
    }
  }

  let processedContent = [];
  if (Array.isArray(content) && content.length > 0) {
    processedContent = content.map(item => {
      const processedItem = { ...item };
      if (template.formSchema.content && template.formSchema.content.itemSchema) {
          Object.entries(template.formSchema.content.itemSchema).forEach(([key, schema]) => {
              if (schema.type === 'number' && processedItem[key] !== undefined) {
                  processedItem[key] = parseFloat(processedItem[key]);
                  if (isNaN(processedItem[key])) processedItem[key] = 0;
              }
          });
      }
      return processedItem;
    });
  }

  // Enforce max images per creation (manifest.assets.maxImagesPerCreation) if content includes image fields
  const maxImagesPerCreation = Number(template.manifest?.assets?.maxImagesPerCreation || 0);
  if (maxImagesPerCreation > 0 && Array.isArray(processedContent)) {
    const imageFieldTypes = new Set(['image','imageArray']);
    const itemSchema = template.formSchema?.content?.itemSchema || {};
    let imageCount = 0;
    processedContent.forEach(item => {
      Object.entries(itemSchema).forEach(([key, schema]) => {
        if (imageFieldTypes.has(schema.type)) {
          const val = item[key];
          if (!val) return;
          if (schema.type === 'image') imageCount += 1;
          else if (schema.type === 'imageArray' && Array.isArray(val)) imageCount += val.length;
        }
      });
    });
    if (imageCount > maxImagesPerCreation) {
      res.status(400);
      throw new Error(`Too many images for this creation (max ${maxImagesPerCreation}).`);
    }
  }

  // Snapshot engine path/version and policy/xp from manifest if available
  const manifest = template.manifest || {};
  const attemptPolicy = manifest.attemptPolicy || 'first_only';
  const manifestXp = manifest.xp || {};
  const xpSnapshot = {
    assignment: {
      enabled: !!manifestXp?.assignment?.enabled,
      amount: Number(manifestXp?.assignment?.amount || 0),
      firstAttemptOnly: manifestXp?.assignment?.firstAttemptOnly !== false, // default true
    },
    online: {
      enabled: !!manifestXp?.online?.enabled,
      amount: Number(manifestXp?.online?.amount || 0),
    }
  };

  const gameCreation = await GameCreation.create({
    name: finalName,
    owner,
    config: processedConfig,
    content: processedContent,
    template: templateId,
    enginePath: template.enginePath,
    engineVersion: manifest.version || undefined,
    attemptPolicy,
  levelLabel: levelLabel || undefined,
  levelId: levelId || undefined,
    xp: xpSnapshot,
  });

  if (gameCreation) {
    // Post-process: move any images uploaded under 'creations/draft' into a per-creation folder and fix URLs
    try {
      const path = require('path');
      const fs = require('fs');
      const baseUploads = path.join(__dirname, '..', 'public', 'uploads', 'templates', String(templateId), 'creations');
      const draftPrefix = `/uploads/templates/${templateId}/creations/draft/`;
      const finalPrefix = `/uploads/templates/${templateId}/creations/${gameCreation._id}/`;
      const itemSchema = template.formSchema?.content?.itemSchema || {};
      const imageFieldTypes = new Set(['image','imageArray']);
      let changed = false;
      const newContent = (Array.isArray(processedContent) ? JSON.parse(JSON.stringify(processedContent)) : []);
      for (let i = 0; i < newContent.length; i++) {
        const item = newContent[i];
        for (const [key, schema] of Object.entries(itemSchema)) {
          if (!imageFieldTypes.has(schema.type)) continue;
          if (schema.type === 'image') {
            const url = item[key];
            if (typeof url === 'string' && url.startsWith(draftPrefix)) {
              const filename = url.substring(draftPrefix.length);
              const src = path.join(baseUploads, 'draft', filename);
              const destDir = path.join(baseUploads, String(gameCreation._id));
              const dest = path.join(destDir, filename);
              if (fs.existsSync(src)) {
                if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                fs.renameSync(src, dest);
                item[key] = finalPrefix + filename;
                changed = true;
              }
            }
          } else if (schema.type === 'imageArray') {
            const arr = Array.isArray(item[key]) ? item[key] : [];
            const updated = [];
            for (const url of arr) {
              if (typeof url === 'string' && url.startsWith(draftPrefix)) {
                const filename = url.substring(draftPrefix.length);
                const src = path.join(baseUploads, 'draft', filename);
                const destDir = path.join(baseUploads, String(gameCreation._id));
                const dest = path.join(destDir, filename);
                if (fs.existsSync(src)) {
                  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                  fs.renameSync(src, dest);
                  updated.push(finalPrefix + filename);
                  changed = true;
                } else {
                  updated.push(url);
                }
              } else {
                updated.push(url);
              }
            }
            item[key] = updated;
          }
        }
      }
      if (changed) {
        gameCreation.content = newContent;
        await gameCreation.save();
      }
    } catch (_) {}

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
  const filter = { owner: req.user._id };
  if (req.query.template) {
    filter.template = req.query.template;
  }

  // Return creations with persisted levelLabel
  const creations = await GameCreation.find(filter)
    .populate('template', 'name status')
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

    // Live access: allow if the student is currently in a live room for this creation
    let isInLiveGame = false;
    try {
      const live = req.liveGames || require('../realtimeState').liveGames;
      // Prefer explicit room code when provided (via header), else scan all rooms
      const hintedCode = req.headers['x-live-room'];
      if (hintedCode && live[hintedCode]) {
        const room = live[hintedCode];
        if (
          String(room.gameCreationId) === String(req.params.id) &&
          Array.isArray(room.players) && room.players.some(p => String(p.userId) === String(req.user._id))
        ) {
          isInLiveGame = true;
        }
      } else if (live) {
        for (const code in live) {
          const room = live[code];
          if (
            String(room.gameCreationId) === String(req.params.id) &&
            Array.isArray(room.players) && room.players.some(p => String(p.userId) === String(req.user._id))
          ) {
            isInLiveGame = true;
            break;
          }
        }
      }
    } catch {}

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
  // Also delete associated results and uploaded assets under /public/uploads/templates/<templateId>/creations/<creationId>
  const GameResult = require('../models/GameResult');
  await GameResult.deleteMany({ gameCreation: gameCreation._id });
  try {
    const path = require('path');
    const fs = require('fs');
    const baseDir = path.join(__dirname, '..', 'public', 'uploads', 'templates', String(gameCreation.template), 'creations', String(gameCreation._id));
    if (fs.existsSync(baseDir)) {
      fs.rmSync(baseDir, { recursive: true, force: true });
    }
  } catch (e) {
    // non-fatal cleanup
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

// server/controllers/gameTemplateController.js

const GameTemplate = require('../models/GameTemplate');
const AdmZip = require('adm-zip');

// @desc    Upload and process a game template bundle (.zip)
// @route   POST /api/templates/upload
// @access  Private/Admin
const uploadGameTemplate = async (req, res) => {
  try {
    // Check if a file was uploaded by multer
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Use adm-zip to read the uploaded file from memory
    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();

    // Find and parse manifest.json
    const manifestEntry = zipEntries.find(entry => entry.entryName === 'manifest.json');
    if (!manifestEntry) {
      return res.status(400).json({ message: 'manifest.json not found in the zip file.' });
    }
    const manifestData = JSON.parse(manifestEntry.getData().toString('utf8'));

    // Find and parse form-schema.json
    const formSchemaEntry = zipEntries.find(entry => entry.entryName === 'form-schema.json');
    if (!formSchemaEntry) {
      return res.status(400).json({ message: 'form-schema.json not found in the zip file.' });
    }
    const formSchemaData = JSON.parse(formSchemaEntry.getData().toString('utf8'));

    // --- Create the new Game Template in the database ---
    const { name, description, platformIntegration, gamification } = manifestData;

    const templateExists = await GameTemplate.findOne({ name });
    if (templateExists) {
      return res.status(400).json({ message: `A game template named '${name}' already exists.` });
    }

    const newTemplate = await GameTemplate.create({
      name,
      description,
      platformIntegration,
      gamification,
      formSchema: formSchemaData,
    });
    
    // For now, we are not saving the 'engine' files. We are just creating the database entry.
    // We will handle serving the engine files in a later step.

    res.status(201).json({ message: 'Game Template uploaded and created successfully!', template: newTemplate });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server Error during file processing.', error: error.message });
  }
};


// --- Existing Functions ---

const createGameTemplate = async (req, res) => {
  // This function can be kept for manual/API-based creation if needed, or removed.
  // For now, we will leave it.
  try {
    const { name, description, platformIntegration, gamification, formSchema } = req.body;
    if (!name || !description || !formSchema) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const templateExists = await GameTemplate.findOne({ name });
    if (templateExists) {
      return res.status(400).json({ message: 'A game template with this name already exists.' });
    }
    const template = await GameTemplate.create({ name, description, platformIntegration, gamification, formSchema });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getGameTemplates = async (req, res) => {
  try {
    const templates = await GameTemplate.find({});
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getGameTemplateById = async (req, res) => {
  try {
    const template = await GameTemplate.findById(req.params.id);
    if (template) {
      res.status(200).json(template);
    } else {
      res.status(404).json({ message: 'Game template not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createGameTemplate,
  getGameTemplates,
  getGameTemplateById,
  uploadGameTemplate, // NEW: Export the upload function
};

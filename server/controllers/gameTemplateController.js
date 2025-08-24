// server/controllers/gameTemplateController.js
const asyncHandler = require('express-async-handler');
const GameTemplate = require('../models/GameTemplate');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

const slugify = (text) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-')
  .replace(/^-+/, '')
  .replace(/-+$/, '');

const uploadGameTemplate = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No template bundle file uploaded');
  }

  const zip = new AdmZip(req.file.buffer);
  const zipEntries = zip.getEntries();

  const manifestEntry = zip.getEntry('manifest.json');
  const schemaEntry = zip.getEntry('form-schema.json');
  const engineDirEntry = zipEntries.find(entry => entry.entryName.startsWith('engine/'));

  if (!manifestEntry || !schemaEntry || !engineDirEntry) {
    res.status(400).json({ message: 'Template bundle is missing one or more required files (manifest.json, form-schema.json, or engine/ folder).' });
    return;
  }

  const manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
  const formSchema = JSON.parse(schemaEntry.getData().toString('utf8'));
  
  // --- THIS IS THE FIX ---
  // 1. Check if a template with this name already exists BEFORE doing anything else.
  const existingTemplate = await GameTemplate.findOne({ name: manifest.name });
  if (existingTemplate) {
    res.status(400).json({ message: `A game template named "${manifest.name}" already exists.` });
    return; // Stop the function here
  }
  // --- END OF FIX ---


  const templateSlug = slugify(manifest.name);
  const uniqueDirName = `${templateSlug}-${Date.now()}`;
  const enginePath = path.join('/engines', uniqueDirName);
  const fullEnginePath = path.join(__dirname, '..', 'public', enginePath);

  if (!fs.existsSync(fullEnginePath)) {
    fs.mkdirSync(fullEnginePath, { recursive: true });
  }

  zipEntries.forEach((zipEntry) => {
    if (zipEntry.entryName.startsWith('engine/') && !zipEntry.isDirectory) {
      const relativePath = zipEntry.entryName.substring('engine/'.length);
      const targetPath = path.join(fullEnginePath, relativePath);
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, zipEntry.getData());
    }
  });

  const gameTemplate = await GameTemplate.create({
    name: manifest.name,
    description: manifest.description,
    manifest: manifest,
    formSchema: formSchema,
    enginePath: enginePath,
    status: 'draft',
    platformIntegration: manifest.platformIntegration,
    gamification: manifest.gamification,
  });

  if (gameTemplate) {
    res.status(201).json(gameTemplate);
  } else {
    res.status(400);
    throw new Error('Invalid game template data');
  }
});

const getGameTemplates = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role !== 'admin') {
    filter.status = 'published';
  }
  const templates = await GameTemplate.find(filter).sort({ createdAt: -1 });
  const mapped = templates.map(t => ({
    ...t.toObject(),
    name: t.displayName || t.name,
  }));
  res.json(mapped);
});

const getGameTemplateById = asyncHandler(async (req, res) => {
  const template = await GameTemplate.findById(req.params.id);
  if (template) {
  const obj = template.toObject();
  obj.name = template.displayName || template.name;
  res.json(obj);
  } else {
    res.status(404);
    throw new Error('Game template not found');
  }
});

const updateTemplateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const template = await GameTemplate.findById(req.params.id);

    if (template) {
        template.status = status;
        const updatedTemplate = await template.save();
        res.json(updatedTemplate);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await GameTemplate.findById(req.params.id);

  if (template) {
    if (template.status === 'published') {
      return res.status(400).json({ message: 'Cannot delete a published template. Deprecate instead.' });
    }
    if (template.enginePath) {
      const fullEnginePath = path.join(__dirname, '..', 'public', template.enginePath);
      if (fs.existsSync(fullEnginePath)) {
        fs.rmSync(fullEnginePath, { recursive: true, force: true });
      }
    }
    await template.deleteOne();
    res.json({ message: 'Template removed' });
  } else {
    res.status(404);
    throw new Error('Template not found');
  }
});

// PATCH: update editable meta fields (admin only)
const updateTemplateMeta = asyncHandler(async (req, res) => {
  const editable = ['displayName','description','tags','category','iconUrl','isFeatured','deprecated','defaultConfigOverrides','status'];
  const bodyKeys = Object.keys(req.body || {});
  const illegal = bodyKeys.filter(k => !editable.includes(k));
  if (illegal.length) {
    return res.status(400).json({ message: 'Illegal fields in update', illegal });
  }
  const template = await GameTemplate.findById(req.params.id);
  if (!template) {
    res.status(404); throw new Error('Template not found');
  }
  // If trying to change status from published back to draft, forbid
  if (template.status === 'published' && req.body.status === 'draft') {
    return res.status(400).json({ message: 'Cannot revert a published template to draft' });
  }
  // Validate defaultConfigOverrides keys
  if (req.body.defaultConfigOverrides) {
    const allowedKeys = Object.keys(template.formSchema?.settings || {});
    const overrideKeys = Object.keys(req.body.defaultConfigOverrides);
    const bad = overrideKeys.filter(k => !allowedKeys.includes(k));
    if (bad.length) {
      return res.status(400).json({ message: 'Invalid override keys', invalid: bad });
    }
  }
  // Apply overrides
  bodyKeys.forEach(k => { template[k] = req.body[k]; });
  const updated = await template.save();
  res.json(updated);
});


module.exports = {
  uploadGameTemplate,
  getGameTemplates,
  getGameTemplateById,
  updateTemplateStatus,
  deleteTemplate,
  updateTemplateMeta,
};

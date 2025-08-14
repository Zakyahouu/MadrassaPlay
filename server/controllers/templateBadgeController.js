const TemplateBadge = require('../models/TemplateBadge');
const EarnedTemplateBadge = require('../models/EarnedTemplateBadge');
const GameResult = require('../models/GameResult');
const GameCreation = require('../models/GameCreation');
const path = require('path');
const fs = require('fs');

// Create or replace badge definition for a template
exports.createTemplateBadge = async (req, res) => {
  try {
    const { template, name, description, evaluationMode, variants } = req.body;
    if (!template || !name || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    await TemplateBadge.findOneAndDelete({ template });
    const badge = await TemplateBadge.create({ template, name, description, evaluationMode, variants });
    res.status(201).json(badge);
  } catch (err) {
    if (/Duplicate variant thresholdPercent/.test(err.message) || /Duplicate variant label/.test(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getTemplateBadges = async (req, res) => {
  try {
    const { template } = req.query;
    const filter = { active: true };
    if (template) filter.template = template;
    const list = await TemplateBadge.find(filter).populate('template', 'name');
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getTemplateBadge = async (req, res) => {
  try {
    const badge = await TemplateBadge.findById(req.params.id).populate('template', 'name');
    if (!badge) return res.status(404).json({ message: 'Not found' });
    res.json(badge);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.updateTemplateBadge = async (req, res) => {
  try {
    const updates = req.body;
    const badge = await TemplateBadge.findById(req.params.id);
    if (!badge) return res.status(404).json({ message: 'Not found' });
    ['name','description','evaluationMode'].forEach(f => { if (updates[f] !== undefined) badge[f] = updates[f]; });
    if (Array.isArray(updates.variants) && updates.variants.length) badge.variants = updates.variants;
    await badge.save();
    res.json(badge);
  } catch (err) {
    if (/Duplicate variant thresholdPercent/.test(err.message) || /Duplicate variant label/.test(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.deleteTemplateBadge = async (req, res) => {
  try {
    const badge = await TemplateBadge.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!badge) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Student: list earned template badges
exports.getMyTemplateBadges = async (req, res) => {
  try {
    const earned = await EarnedTemplateBadge.find({ user: req.user._id })
      .populate({ path: 'templateBadge', populate: { path: 'template', select: 'name' } })
      .sort({ updatedAt: -1 });
    // Augment each with progress info (current variant percentage and next threshold delta)
    const enriched = earned.map(e => {
      const badge = e.templateBadge;
      if (!badge || !badge.variants) return e;
      const currentVariant = badge.variants.find(v => v.label === e.variantLabel);
      const ordered = badge.variants; // already sorted desc (highest first)
      const currentIdx = ordered.findIndex(v => v.label === e.variantLabel);
      const nextHigher = currentIdx > 0 ? ordered[currentIdx - 1] : null; // since sorted desc, lower index = higher tier
      return {
        ...e.toObject(),
        progress: {
          percentage: e.percentage,
            currentThreshold: currentVariant?.thresholdPercent ?? null,
            nextVariant: nextHigher ? {
              label: nextHigher.label,
              thresholdPercent: nextHigher.thresholdPercent,
              iconUrl: nextHigher.iconUrl
            } : null,
            neededForNext: nextHigher ? Math.max(0, nextHigher.thresholdPercent - e.percentage) : null,
        }
      };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Internal util: award/upgrade template badge for a result
exports.evaluateTemplateBadgeForResult = async ({ userId, gameCreationId, percentage }) => {
  try {
    const creation = await GameCreation.findById(gameCreationId).select('template');
    if (!creation) return;
    const badge = await TemplateBadge.findOne({ template: creation.template, active: true });
    if (!badge) return;

    let effectivePercentage = percentage;
    if (badge.evaluationMode === 'highestAttempt') {
      const agg = await GameResult.aggregate([
        { $match: { student: userId } },
        { $lookup: { from: 'gamecreations', localField: 'gameCreation', foreignField: '_id', as: 'gc' } },
        { $unwind: '$gc' },
        { $match: { 'gc.template': creation.template } },
        { $project: { percent: { $cond: [ { $gt: ['$totalPossibleScore', 0] }, { $multiply: [ { $divide: ['$score','$totalPossibleScore'] }, 100 ] }, 0 ] } } },
        { $group: { _id: null, maxP: { $max: '$percent' } } }
      ]);
      if (agg.length) effectivePercentage = Math.round(agg[0].maxP);
    } else if (badge.evaluationMode === 'firstAttempt') {
      const first = await GameResult.find({ student: userId })
        .sort({ createdAt: 1 })
        .populate({ path: 'gameCreation', select: 'template' });
      const firstForTemplate = first.find(r => r.gameCreation?.template?.toString() === creation.template.toString());
      if (firstForTemplate) {
        effectivePercentage = firstForTemplate.totalPossibleScore > 0 ? Math.round((firstForTemplate.score / firstForTemplate.totalPossibleScore) * 100) : 0;
      }
    }

    const variant = badge.variants.find(v => effectivePercentage >= v.thresholdPercent);
    if (!variant) return;

    const existing = await EarnedTemplateBadge.findOne({ user: userId, templateBadge: badge._id });
    if (!existing) {
      await EarnedTemplateBadge.create({ user: userId, templateBadge: badge._id, variantLabel: variant.label, percentage: effectivePercentage });
      return;
    }
    const currentIdx = badge.variants.findIndex(v => v.label === existing.variantLabel);
    const newIdx = badge.variants.findIndex(v => v.label === variant.label);
    if (newIdx >= 0 && newIdx < currentIdx) {
      existing.variantLabel = variant.label;
      existing.percentage = effectivePercentage;
      await existing.save();
    }
  } catch (e) {
    // silent
  }
};

// Admin: batch re-evaluate a template badge (e.g., after changing thresholds/mode)
exports.recalculateTemplateBadge = async (req, res) => {
  try {
    const { id } = req.params; // badge id
    const badge = await TemplateBadge.findById(id);
    if (!badge || !badge.active) return res.status(404).json({ message: 'Badge not found' });
    // Find all users who have any game results for games built from this template
    const creations = await GameCreation.find({ template: badge.template }).select('_id');
    const creationIds = creations.map(c => c._id);
    if (!creationIds.length) return res.json({ updated: 0, message: 'No game creations for template.' });
    const results = await GameResult.find({ gameCreation: { $in: creationIds } }).select('student score totalPossibleScore gameCreation createdAt');
    const byUser = new Map();
    for (const r of results) {
      if (!byUser.has(r.student.toString())) byUser.set(r.student.toString(), []);
      byUser.get(r.student.toString()).push(r);
    }
    let updated = 0;
    for (const [userId, userResults] of byUser.entries()) {
      let effectivePercentage = 0;
      if (badge.evaluationMode === 'highestAttempt') {
        effectivePercentage = userResults.reduce((acc, r) => {
          const pct = r.totalPossibleScore > 0 ? (r.score / r.totalPossibleScore) * 100 : 0;
          return pct > acc ? pct : acc;
        }, 0);
      } else { // firstAttempt
        const first = userResults.sort((a, b) => a.createdAt - b.createdAt)[0];
        effectivePercentage = first.totalPossibleScore > 0 ? (first.score / first.totalPossibleScore) * 100 : 0;
      }
      effectivePercentage = Math.round(effectivePercentage);
      const variant = badge.variants.find(v => effectivePercentage >= v.thresholdPercent);
      if (!variant) continue;
      const existing = await EarnedTemplateBadge.findOne({ user: userId, templateBadge: badge._id });
      if (!existing) {
        await EarnedTemplateBadge.create({ user: userId, templateBadge: badge._id, variantLabel: variant.label, percentage: effectivePercentage });
        updated++;
      } else {
        const currentIdx = badge.variants.findIndex(v => v.label === existing.variantLabel);
        const newIdx = badge.variants.findIndex(v => v.label === variant.label);
        if (newIdx >= 0 && newIdx < currentIdx) {
          existing.variantLabel = variant.label;
          existing.percentage = effectivePercentage;
          await existing.save();
          updated++;
        }
      }
    }
    res.json({ updated, totalUsers: byUser.size });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Admin: simple icon upload (multipart/form-data, field 'icon') storing in /public/badge-icons
exports.uploadBadgeIcon = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // Defensive validations (multer already applied limits & mime filter)
    const MAX_BYTES = 2 * 1024 * 1024; // 2MB
    const allowedMimes = ['image/png','image/jpeg','image/jpg','image/webp','image/gif'];
    if (req.file.size > MAX_BYTES) {
      return res.status(400).json({ message: 'File too large (max 2MB)' });
    }
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type' });
    }
    const uploadDir = path.join(__dirname, '..', 'public', 'badge-icons');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const safeName = Date.now() + '-' + req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, req.file.buffer);
    const publicPath = `/badge-icons/${safeName}`;
    res.status(201).json({ url: publicPath });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

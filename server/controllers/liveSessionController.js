const LiveSession = require('../models/LiveSession');
const LiveParticipant = require('../models/LiveParticipant');
const GameCreation = require('../models/GameCreation');
const Enrollment = require('../models/Enrollment');
const GameResult = require('../models/GameResult');

const CODE_LENGTH = 8;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = async () => {
  const make = () => Array.from({length: CODE_LENGTH}, () => CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join('');
  for (let i=0;i<5;i++) { const code = make(); const exists = await LiveSession.findOne({ code }).select('_id').lean(); if (!exists) return code; }
  return make();
};

const rankComparator = (a, b) => {
  // One consistent rule: higher score, then faster time, then fewer mistakes, then earlier finish
  if (a.score !== b.score) return b.score - a.score;
  if (a.effectiveTimeMs !== b.effectiveTimeMs) return a.effectiveTimeMs - b.effectiveTimeMs;
  if ((a.wrong || 0) !== (b.wrong || 0)) return (a.wrong || 0) - (b.wrong || 0);
  return (a.finishedAt || Infinity) - (b.finishedAt || Infinity);
};

exports.createSession = async (req, res) => {
  try {
  const { gameCreationId, title, classIds = [], allowLateJoin = false, config = {} } = req.body;
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Teacher only' });
    const creation = await GameCreation.findById(gameCreationId).select('_id owner');
    if (!creation || String(creation.owner) !== String(req.user._id)) return res.status(403).json({ message: 'Not your game' });

    // Validate classes belong to this teacher
    const classes = Array.isArray(classIds) ? classIds : [];
    if (!classes.length) {
      return res.status(400).json({ message: 'At least one class is required' });
    }
    if (classes.length) {
      const Class = require('../models/Class');
      const owned = await Class.countDocuments({ _id: { $in: classes }, teacherId: req.user._id });
      if (owned !== classes.length) return res.status(400).json({ message: 'Invalid classes for this teacher' });
    }

    const code = await genCode();
  const session = await LiveSession.create({
      code,
      teacherId: req.user._id,
      gameCreationId,
      classes,
      title: title || undefined,
      allowLateJoin: !!allowLateJoin,
      config: {
        scoring: ['best','fastest','hybrid'].includes(config.scoring) ? config.scoring : 'hybrid',
        timePenaltyPerWrongMs: Number.isFinite(Number(config.timePenaltyPerWrongMs)) ? Number(config.timePenaltyPerWrongMs) : 3000,
        strictProgress: !!config.strictProgress,
      }
    });
    res.status(201).json({ sessionId: session._id, code: session.code });
  } catch (e) { res.status(500).json({ message: 'Server Error', error: e.message }); }
};

exports.listSessions = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Teacher only' });
    const { status } = req.query;
    const q = { teacherId: req.user._id };
    // Map friendly filters to schema statuses
    if (status === 'active') {
      q.status = { $in: ['lobby', 'running'] };
    } else if (status === 'past') {
      q.status = 'ended';
    } else if (status) {
      q.status = status; // allow direct usage if provided
    }

    const sessions = await LiveSession.find(q).sort({ createdAt: -1 }).lean();
    if (!sessions.length) return res.json([]);

    // Attach basic game info
    const creationIds = [...new Set(sessions.map(s => String(s.gameCreationId)))];
    const creations = await GameCreation.find({ _id: { $in: creationIds } }).select('_id name').lean();
    const creationMap = new Map(creations.map(c => [String(c._id), c]));

    // Aggregate participant metrics per session
    const ids = sessions.map(s => s._id);
    const parts = await LiveParticipant.aggregate([
      { $match: { sessionId: { $in: ids } } },
      { $group: { _id: '$sessionId', count: { $sum: 1 }, avgScore: { $avg: '$score' } } }
    ]);
    const partMap = new Map(parts.map(p => [String(p._id), { count: p.count, avgScore: p.avgScore }]));

    const enriched = sessions.map(s => ({
      ...s,
      gameCreation: creationMap.get(String(s.gameCreationId)) || null,
      participantsCount: partMap.get(String(s._id))?.count || 0,
      averageScore: partMap.get(String(s._id))?.avgScore ? Math.round(partMap.get(String(s._id))?.avgScore) : undefined,
    }));

    res.json(enriched);
  } catch (e) { res.status(500).json({ message: 'Server Error', error: e.message }); }
};

exports.getSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const s = await LiveSession.findById(id).lean();
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (String(s.teacherId) !== String(req.user._id) && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const participants = await LiveParticipant.find({ sessionId: id }).lean();
    // Ranking
  const ranks = participants.map(p => ({
      studentId: p.studentId,
      firstName: p.firstName,
      lastName: p.lastName,
      classId: p.classId,
      score: p.score,
      correct: p.correct,
      wrong: p.wrong,
      effectiveTimeMs: p.effectiveTimeMs,
      finishedAt: p.finishedAt,
  })).sort((a,b)=>rankComparator(a,b));
    res.json({ session: s, ranks, participants });
  } catch (e) { res.status(500).json({ message: 'Server Error', error: e.message }); }
};

// Lightweight details endpoint for lobby header or quick inspect
exports.getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const s = await LiveSession.findById(id).lean();
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (String(s.teacherId) !== String(req.user._id) && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const creation = await GameCreation.findById(s.gameCreationId).select('_id name').lean();
    res.json({ ...s, gameCreation: creation || null });
  } catch (e) { res.status(500).json({ message: 'Server Error', error: e.message }); }
};

exports.endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const s = await LiveSession.findById(id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (String(s.teacherId) !== String(req.user._id) && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (s.status === 'ended') return res.json({ message: 'Already ended' });
    s.status = 'ended';
    s.endedAt = new Date();
    if (!s.startedAt) s.startedAt = new Date(s.createdAt || Date.now());
    await s.save();
    // Optional: if socket layer is available globally, emit end signal here
    res.json({ message: 'Session ended' });
  } catch (e) { res.status(500).json({ message: 'Server Error', error: e.message }); }
};

// Permanently delete a past session and all associated data (participants and results)
exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const s = await LiveSession.findById(id).lean();
    if (!s) return res.status(404).json({ message: 'Not found' });
    // Only the owning teacher (or admins/managers) can delete
    const isOwner = String(s.teacherId) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Only allow deleting ended sessions to avoid accidental active removal
    if (s.status !== 'ended') {
      return res.status(400).json({ message: 'Only past sessions can be deleted' });
    }
    // Remove participants and results first, then session
    await LiveParticipant.deleteMany({ sessionId: id });
    await GameResult.deleteMany({ liveSessionId: id });
    await LiveSession.deleteOne({ _id: id });
    return res.json({ deleted: true });
  } catch (e) { res.status(500).json({ message: 'Server Error', error: e.message }); }
};

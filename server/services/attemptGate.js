// server/services/attemptGate.js
// Centralized attempt gating logic reused by controllers

const GameResult = require('../models/GameResult');

/**
 * Compute whether a student can attempt a specific game within an assignment.
 * Returns a normalized shape used by UI and submission path:
 * { allow: boolean, reason: 'assignment_completed'|'canceled'|'time_window'|'attempt_limit'|null, attemptNumber, attemptLimit, attemptsRemaining }
 * - When blocked by status/time, attemptNumber is 0 and attemptsRemaining is 0.
 */
async function checkCanAttempt({ assignment, studentId, gameId, nowTs = Date.now() }) {
  if (!assignment) {
    return { allow: false, reason: 'assignment_completed', attemptNumber: 0, attemptLimit: 1, attemptsRemaining: 0 };
  }

  const attemptLimit = assignment.attemptLimit || 1;
  const startTs = assignment.startDate ? new Date(assignment.startDate).getTime() : 0;
  const endTs = assignment.endDate ? new Date(assignment.endDate).getTime() : 0;

  // Status/time window gating
  if (assignment.status === 'canceled') {
    return { allow: false, reason: 'canceled', attemptNumber: 0, attemptLimit, attemptsRemaining: 0 };
  }
  if (assignment.status === 'completed') {
    return { allow: false, reason: 'assignment_completed', attemptNumber: 0, attemptLimit, attemptsRemaining: 0 };
  }
  if (startTs && nowTs < startTs) {
    return { allow: false, reason: 'time_window', attemptNumber: 0, attemptLimit, attemptsRemaining: 0 };
  }
  if (endTs && nowTs >= endTs) {
    return { allow: false, reason: 'assignment_completed', attemptNumber: 0, attemptLimit, attemptsRemaining: 0 };
  }

  // Attempt count for this assignment/game/student
  const prev = await GameResult.find({ assignment: assignment._id, student: studentId, gameCreation: gameId })
    .select('_id')
    .lean();
  const attemptNumber = (prev?.length || 0) + 1;
  const attemptsRemaining = Math.max(0, attemptLimit - (prev?.length || 0));
  if ((prev?.length || 0) >= attemptLimit) {
    return { allow: false, reason: 'attempt_limit', attemptNumber, attemptLimit, attemptsRemaining };
  }

  return { allow: true, reason: null, attemptNumber, attemptLimit, attemptsRemaining };
}

module.exports = { checkCanAttempt };

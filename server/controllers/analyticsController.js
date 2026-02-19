// server/controllers/analyticsController.js
const Assignment = require('../models/Assignment');
const GameResult = require('../models/GameResult');
const GameCreation = require('../models/GameCreation');
const User = require('../models/User');

// @desc    Get detailed analytics for an assignment
// @route   GET /api/analytics/assignment/:assignmentId
// @access  Private (Teacher/Admin/Manager)
const getAssignmentAnalytics = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        // 1. Fetch Assignment & Authorization
        const assignment = await Assignment.findById(assignmentId)
            .populate('gameCreations', 'name content template')
            .lean();

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Authorization Check
        const isTeacher = req.user.role === 'teacher';
        const isOwner = assignment.teacher.toString() === req.user._id.toString();
        const isElevated = req.user.role === 'admin' || req.user.role === 'manager';

        if (isTeacher && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to view analytics for this assignment.' });
        }

        // 2. Fetch All Results for this Assignment
        const results = await GameResult.find({
            assignment: assignmentId,
            counted: true
        })
            .populate('student', 'name email')
            .lean();

        // 3. Process Data per Game Creation
        const gamesAnalytics = assignment.gameCreations.map(game => {
            const gameResults = results.filter(r => r.gameCreation.toString() === game._id.toString());

            // A. Summary Stats
            const totalAttempts = gameResults.length;
            const uniquePlayers = new Set(gameResults.map(r => r.student._id.toString())).size;
            const totalScore = gameResults.reduce((sum, r) => sum + r.score, 0);
            const totalPossible = gameResults.reduce((sum, r) => sum + r.totalPossibleScore, 0);
            const averagePercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

            // B. Question Analysis
            // Normalize content to ensure it handles different template structures
            const questionsContent = Array.isArray(game.content) ? game.content : [];

            const questionStats = questionsContent.map((q, index) => {
                let correctCount = 0;
                let incorrectCount = 0;
                const answerDistribution = {}; // { "Option A": 5, "Option B": 2 }

                gameResults.forEach(result => {
                    // Find answer for this question index
                    const answer = result.answers?.find(a => a.index === index);

                    if (answer) {
                        if (answer.correct) {
                            correctCount++;
                        } else {
                            incorrectCount++;
                        }

                        // Track distribution (handling text or option index)
                        const key = answer.selectedText || answer.val || 'No Answer';
                        answerDistribution[key] = (answerDistribution[key] || 0) + 1;
                    }
                });

                return {
                    index,
                    text: q.question || q.prompt || `Question ${index + 1}`,
                    type: q.type || 'unknown',
                    correctCount,
                    incorrectCount,
                    accuracy: (correctCount + incorrectCount) > 0
                        ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
                        : 0,
                    distribution: answerDistribution
                };
            });

            // C. Student Leaderboard (Best Attempt)
            // Group by student, find best score
            const studentMap = {};

            gameResults.forEach(r => {
                const sId = r.student._id.toString();
                const pct = r.totalPossibleScore > 0 ? (r.score / r.totalPossibleScore) * 100 : 0;

                if (!studentMap[sId]) {
                    studentMap[sId] = {
                        studentId: sId,
                        name: r.student.name || r.student.email,
                        attempts: 0,
                        bestScore: 0,
                        bestPercentage: 0,
                        lastPlayed: r.createdAt
                    };
                }

                studentMap[sId].attempts++;
                if (pct > studentMap[sId].bestPercentage) {
                    studentMap[sId].bestPercentage = Math.round(pct);
                    studentMap[sId].bestScore = r.score;
                }
                // Update last played if newer
                if (new Date(r.createdAt) > new Date(studentMap[sId].lastPlayed)) {
                    studentMap[sId].lastPlayed = r.createdAt;
                }
            });

            const leaderboard = Object.values(studentMap).sort((a, b) => b.bestPercentage - a.bestPercentage);

            return {
                gameId: game._id,
                name: game.name,
                template: game.template, // useful for frontend renderers
                summary: {
                    averagePercentage,
                    totalAttempts,
                    uniquePlayers
                },
                questions: questionStats,
                leaderboard
            };
        });

        res.json({
            assignment: {
                id: assignment._id,
                title: assignment.title,
                status: assignment.status,
                deadline: assignment.endDate
            },
            games: gamesAnalytics
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Server Error processing analytics.' });
    }
};

module.exports = {
    getAssignmentAnalytics
};

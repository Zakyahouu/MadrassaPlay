// Safe route loader to prevent path-to-regexp errors
const express = require('express');

/**
 * Safely load a route file with error handling
 * @param {string} routePath - Path to the route file
 * @param {string} mountPath - Path to mount the routes on
 * @returns {Object} - Express router or null if failed
 */
function safeLoadRoute(routePath, mountPath) {
  try {
    console.log(`🔄 Loading route: ${mountPath} from ${routePath}`);

    // Clear require cache to ensure fresh load
    delete require.cache[require.resolve(routePath)];

    const router = require(routePath);

    // Validate that it's a valid router
    if (!router || typeof router !== 'function') {
      throw new Error(`Invalid router exported from ${routePath}`);
    }

    console.log(`✅ Successfully loaded route: ${mountPath}`);
    return router;

  } catch (error) {
    console.error(`❌ Failed to load route ${mountPath}:`, error.message);

    // Return a dummy router that logs the error
    const dummyRouter = express.Router();
    dummyRouter.all('*', (req, res) => {
      res.status(500).json({
        error: 'Route unavailable',
        message: `Route ${mountPath} failed to load: ${error.message}`
      });
    });

    return dummyRouter;
  }
}

/**
 * Load all routes with error handling
 * @param {Express} app - Express app instance
 */
function loadAllRoutes(app) {
  const routes = [
    { path: '/api/users', file: './routes/userRoutes' },
    { path: '/api/schools', file: './routes/schoolRoutes' },
    { path: '/api/school-documents', file: './routes/schoolDocumentRoutes' },
    { path: '/api/catalog', file: './routes/catalogRoutes' },
    { path: '/api/teachers', file: './routes/teacherRoutes' },
    { path: '/api/students', file: './routes/studentRoutes' },
    { path: '/api/templates', file: './routes/gameTemplateRoutes' },
    { path: '/api/creations', file: './routes/gameCreationRoutes' },
    { path: '/api/assignments', file: './routes/assignmentRoutes' },
    { path: '/api/results', file: './routes/gameResultRoutes' },
    { path: '/api/template-badges', file: './routes/templateBadgeRoutes' },
    { path: '/api/leaderboard', file: './routes/leaderboardRoutes' },
    { path: '/api/reporting', file: './routes/reportingRoutes' },
    { path: '/api/staff', file: './routes/staffRoutes' },
    { path: '/api/employees', file: './routes/employeeRoutes' },
    { path: '/api/classes', file: './routes/classResourceRoutes' },
    { path: '/api/classes', file: './routes/classRoutes' },
    { path: '/api/enrollments', file: './routes/enrollmentRoutes' },
    { path: '/api/payments', file: './routes/paymentRoutes' },
    { path: '/api/attendance', file: './routes/attendanceRoutes' },
    { path: '/api/rooms', file: './routes/roomRoutes' },
    { path: '/api/equipment', file: './routes/equipmentRoutes' },
    { path: '/api/advertisements', file: './routes/advertisementRoutes' },
<<<<<<< Updated upstream
  { path: '/api/announcements', file: './routes/announcementRoutes' },
=======
    { path: '/api/public', file: './routes/publicRoutes' },
    { path: '/api/announcements', file: './routes/announcementRoutes' },
>>>>>>> Stashed changes
    { path: '/api/manager', file: './routes/managerRoutes' },
    { path: '/api/finance', file: './routes/financeRoutes' },
    { path: '/api/logs', file: './routes/logRoutes' },
    { path: '/api/live-sessions', file: './routes/liveSessionRoutes' },
    { path: '/api/auth', file: './routes/federatedAuthRoutes' },
  ];

  console.log('🚀 Starting safe route loading...\n');

  routes.forEach(({ path, file }) => {
    const router = safeLoadRoute(file, path);
    app.use(path, router);
  });

  console.log('\n✅ All routes loaded successfully');
}

module.exports = { safeLoadRoute, loadAllRoutes };

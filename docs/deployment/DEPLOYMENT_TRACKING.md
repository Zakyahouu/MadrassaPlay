# Deployment Tracking

This document tracks changes that may affect staging/production deployment and hosting. Update it after each fix or feature.

## Change Log

- 2026-03-15: Fix admin school credentials PDF/UI to show manager contact fields from `contact.*` when root fields are empty. Files: client/src/components/admin/CredentialsPopup.jsx
- 2026-03-15: Allow admin manager creation to include contact fields and persist them on creation. Files: server/controllers/schoolController.js, client/src/components/admin/manager/ManagerCreateForm.jsx
- 2026-03-15: Include legacy manager contact fields when populating school managers. Files: server/controllers/schoolController.js
- 2026-03-15: Harden public user registration so only admins can create privileged roles. Files: server/middleware/authMiddleware.js, server/routes/userRoutes.js, server/controllers/userController.js
- 2026-03-15: Align account creation rules: admin can create managers only; managers can create teacher/student/staff for their own school. Files: server/controllers/userController.js
- 2026-03-15: Honor trial duration on school creation and block logins after trial expiration. Files: server/controllers/schoolController.js, server/controllers/userController.js
- 2026-03-15: Fix subscription start date field, extend trials from current expiry, and enforce school status on authenticated requests. Files: client/src/components/admin/SchoolManager.jsx, server/controllers/schoolController.js, server/middleware/authMiddleware.js

## Staging/Production Checklist

- [ ] Confirm server `.env` values for staging/production (PORT, MONGO_URI, JWT_SECRET).
- [ ] Ensure Vite build env and API base/proxy settings align with target environment.
- [ ] Verify uploads/storage paths and permissions.
- [ ] Validate CORS and allowed origins for frontend domain.
- [ ] Confirm admin credentials bootstrap process for empty databases.
- [ ] Run smoke tests for admin/manager/teacher/student/school flows.

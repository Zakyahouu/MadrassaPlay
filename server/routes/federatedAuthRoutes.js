// W3: Federated Auth Routes - Directis360 ↔ Wajibet Integration
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const School = require('../models/School');

const router = express.Router();

// Map Directis360 roles → Wajibet roles
const ROLE_MAP = {
    'TEACHER': 'teacher',
    'STUDENT': 'student',
    'HEADMASTER': 'manager',
    'STAFF': 'staff',
    'PARENT': 'student',
};

/**
 * POST /api/auth/federated
 * Exchange a Directis360 exchange token for a Wajibet JWT session.
 * Auto-provisions user and school if they don't exist.
 */
router.post('/federated', async (req, res) => {
    const { exchangeToken } = req.body;

    if (!exchangeToken) {
        return res.status(400).json({ message: 'Exchange token required' });
    }

    try {
        // 1. Verify & decode the exchange token
        const decoded = jwt.verify(exchangeToken, process.env.FEDERATED_SECRET);

        // 2. Validate token purpose
        if (decoded.purpose !== 'directis_wajibet_exchange') {
            return res.status(400).json({ message: 'Invalid token purpose' });
        }

        const wajibetRole = ROLE_MAP[decoded.role] || 'student';

        // 3. Find or create the school
        let school = await School.findOne({
            externalId: decoded.directisSchoolId,
            externalSource: 'directis360',
        });

        if (!school) {
            const schoolName = `School-${decoded.directisSchoolId.slice(-6)}`;
            // Double check by name to avoid E11000 errors if name is already taken
            school = await School.findOne({ name: schoolName });

            if (!school) {
                school = await School.create({
                    name: schoolName,
                    externalId: decoded.directisSchoolId,
                    externalSource: 'directis360',
                });
                console.log(`[federated] Auto-created school for Directis360 school: ${decoded.directisSchoolId}`);
            } else {
                // Link existing school by name
                school.externalId = decoded.directisSchoolId;
                school.externalSource = 'directis360';
                await school.save();
                console.log(`[federated] Linked existing school by name: ${schoolName}`);
            }
        }

        // 4. Find or create the user
        let user = await User.findOne({
            externalId: decoded.directisUserId,
            externalSource: 'directis360',
        });

        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            const nameParts = (decoded.full_name || 'Directis User').trim().split(' ');
            const firstName = nameParts[0] || 'Directis';
            const lastName = nameParts.slice(1).join(' ') || 'User';
            const email = decoded.email || `directis_${decoded.directisUserId.slice(-8)}@federated.local`;

            user = await User.create({
                firstName,
                lastName,
                email,
                password: crypto.randomBytes(32).toString('hex'), // Random password (never used)
                role: wajibetRole,
                school: school._id,
                experience: wajibetRole === 'teacher' ? 0 : undefined, // Fix: experience is required for teachers
                externalId: decoded.directisUserId,
                externalSource: 'directis360',
                externalSchoolId: decoded.directisSchoolId,
                externalMeta: {
                    phone_number: decoded.phone_number,
                    national_ID: decoded.national_ID,
                    importedAt: new Date(),
                },
            });

            console.log(`[federated] Auto-provisioned user: ${user._id} (${firstName} ${lastName})`);
        } else {
            // Sync name if changed in Directis360
            if (decoded.full_name) {
                const nameParts = decoded.full_name.trim().split(' ');
                const updates = {};
                if (nameParts[0] && nameParts[0] !== user.firstName) updates.firstName = nameParts[0];
                const newLast = nameParts.slice(1).join(' ');
                if (newLast && newLast !== user.lastName) updates.lastName = newLast;

                if (Object.keys(updates).length > 0) {
                    await User.updateOne({ _id: user._id }, { $set: updates });
                    Object.assign(user, updates); // Reflect in response
                }
            }
        }

        // 5. Issue Wajibet JWT
        const token = jwt.sign(
            { id: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        // 6. Respond
        res.json({
            token,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                school: school._id,
                externalSource: user.externalSource,
            },
            isNewUser,
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Exchange token expired. Please try again.', code: 'TOKEN_EXPIRED' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid exchange token', code: 'TOKEN_INVALID' });
        }
        console.error('[federated] Auth error:', err);
        res.status(500).json({ message: 'Authentication failed' });
    }
});

module.exports = router;

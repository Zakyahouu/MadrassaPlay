// server/services/schoolDeletionService.js

const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const School = require('../models/School');
const SchoolDeletion = require('../models/SchoolDeletion');
const User = require('../models/User');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Advertisement = require('../models/Advertisement');

class SchoolDeletionService {
  constructor() {
    // Safety gate: only enable cron if explicitly allowed via env
    const enabled = process.env.ENABLE_SCHOOL_DELETION_CRON === 'true';
    if (enabled) {
      // Schedule daily check for schools to be permanently deleted
      this.scheduleDeletionCheck();
    } else {
      // No-op in dev/test/prod unless explicitly enabled
      // console.log('[SchoolDeletionService] Cron disabled (set ENABLE_SCHOOL_DELETION_CRON=true to enable)');
    }
  }

  async initiateSchoolDeletion(schoolId) {
    try {
      // Set school status to deleted
      await School.findByIdAndUpdate(schoolId, { status: 'deleted' });

      // Count dependencies
      const dependencyCount = await this.countDependencies(schoolId);

      // Create deletion record with 30-day countdown
      const scheduledDeletionAt = new Date();
      scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 30);

      const deletionRecord = await SchoolDeletion.create({
        schoolId,
        scheduledDeletionAt,
        dependencyCount,
        status: 'pending',
      });

      return {
        message: 'School deletion initiated. 30-day countdown started.',
        deletionRecord,
        dependencyCount,
      };
    } catch (error) {
      throw new Error(`Failed to initiate school deletion: ${error.message}`);
    }
  }

  async countDependencies(schoolId) {
    try {
      const [users, classes, enrollments, payments, attendance, advertisements] = await Promise.all([
        User.countDocuments({ schoolId }),
        Class.countDocuments({ schoolId }),
        Enrollment.countDocuments({ schoolId }),
        Payment.countDocuments({ schoolId }),
        Attendance.aggregate([
          {
            $lookup: {
              from: 'enrollments',
              localField: 'enrollmentId',
              foreignField: '_id',
              as: 'enrollment'
            }
          },
          {
            $match: {
              'enrollment.schoolId': schoolId
            }
          },
          {
            $count: 'total'
          }
        ]).then(result => result[0]?.total || 0),
        Advertisement.countDocuments({ schoolId }),
      ]);

      return {
        users,
        classes,
        enrollments,
        payments,
        attendance,
        advertisements,
      };
    } catch (error) {
      throw new Error(`Failed to count dependencies: ${error.message}`);
    }
  }

  async cancelSchoolDeletion(schoolId) {
    try {
      // Find deletion record
      const deletionRecord = await SchoolDeletion.findOne({
        schoolId,
        status: 'pending'
      });

      if (!deletionRecord) {
        throw new Error('No pending deletion found for this school');
      }

      // Check if still within 30-day window
      if (new Date() > deletionRecord.scheduledDeletionAt) {
        throw new Error('Deletion deadline has passed. Cannot cancel.');
      }

      // Cancel deletion
      deletionRecord.status = 'cancelled';
      await deletionRecord.save();

      // Restore school status
      await School.findByIdAndUpdate(schoolId, { status: 'active' });

      return { message: 'School deletion cancelled successfully' };
    } catch (error) {
      throw new Error(`Failed to cancel school deletion: ${error.message}`);
    }
  }

  async executePermamentDeletion(schoolId) {
    try {
      // Generate backup
      const backupPath = await this.generateBackup(schoolId);

      // Delete all dependent data in correct order
      await this.purgeDependentData(schoolId);

      // Delete school
      await School.findByIdAndDelete(schoolId);

      // Mark deletion as completed
      await SchoolDeletion.findOneAndUpdate(
        { schoolId },
        { status: 'completed', backupPath }
      );

      return { message: 'School permanently deleted', backupPath };
    } catch (error) {
      throw new Error(`Failed to execute permanent deletion: ${error.message}`);
    }
  }

  async generateBackup(schoolId) {
    try {
      // Create backup directory
      const backupDir = path.join(__dirname, '..', 'backups', schoolId.toString());
      await fs.mkdir(backupDir, { recursive: true });

      // Collect all school data
      const school = await School.findById(schoolId);
      const users = await User.find({ schoolId });
      const classes = await Class.find({ schoolId });
      const enrollments = await Enrollment.find({ schoolId });
      const payments = await Payment.find({ schoolId });
      const advertisements = await Advertisement.find({ schoolId });

      // Get attendance records for this school
      const schoolEnrollmentIds = enrollments.map(e => e._id);
      const attendance = await Attendance.find({
        enrollmentId: { $in: schoolEnrollmentIds }
      });

      const backupData = {
        metadata: {
          backupDate: new Date(),
          schoolId,
          schoolName: school?.name,
        },
        school,
        users,
        classes,
        enrollments,
        payments,
        attendance,
        advertisements,
      };

      // Save backup file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}.json`;
      const filePath = path.join(backupDir, filename);
      
      await fs.writeFile(filePath, JSON.stringify(backupData, null, 2));

      return filePath;
    } catch (error) {
      throw new Error(`Failed to generate backup: ${error.message}`);
    }
  }

  async purgeDependentData(schoolId) {
    try {
      // Get enrollment IDs for attendance deletion
      const enrollments = await Enrollment.find({ schoolId });
      const enrollmentIds = enrollments.map(e => e._id);

      // Delete in correct order (dependencies first)
      await Attendance.deleteMany({ enrollmentId: { $in: enrollmentIds } });
      await Payment.deleteMany({ schoolId });
      await Advertisement.deleteMany({ schoolId });
      await Enrollment.deleteMany({ schoolId });
      await Class.deleteMany({ schoolId });
      await User.deleteMany({ schoolId });

      return { message: 'All dependent data purged successfully' };
    } catch (error) {
      throw new Error(`Failed to purge dependent data: ${error.message}`);
    }
  }

  scheduleDeletionCheck() {
    // Run daily at 2 AM to check for schools scheduled for deletion
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('Running scheduled deletion check...');
        
        const now = new Date();
        const pendingDeletions = await SchoolDeletion.find({
          status: 'pending',
          scheduledDeletionAt: { $lte: now }
        });

        for (const deletion of pendingDeletions) {
          try {
            await this.executePermamentDeletion(deletion.schoolId);
            console.log(`School ${deletion.schoolId} permanently deleted`);
          } catch (error) {
            console.error(`Failed to delete school ${deletion.schoolId}:`, error.message);
          }
        }
      } catch (error) {
        console.error('Scheduled deletion check failed:', error.message);
      }
    });
  }

  async getDeletionStatus(schoolId) {
    try {
      const deletionRecord = await SchoolDeletion.findOne({ schoolId })
        .populate('schoolId', 'name status');

      if (!deletionRecord) {
        return { message: 'No deletion record found for this school' };
      }

      const daysRemaining = Math.ceil(
        (deletionRecord.scheduledDeletionAt - new Date()) / (1000 * 60 * 60 * 24)
      );

      return {
        deletionRecord,
        daysRemaining: Math.max(0, daysRemaining),
        canCancel: daysRemaining > 0 && deletionRecord.status === 'pending',
      };
    } catch (error) {
      throw new Error(`Failed to get deletion status: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new SchoolDeletionService();

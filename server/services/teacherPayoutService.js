// server/services/teacherPayoutService.js

const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');

/**
 * Calculate teacher earnings for a specific month
 * @param {ObjectId} schoolId - School ID
 * @param {Number} year - Year
 * @param {Number} month - Month (1-12)
 * @returns {Object} Teacher earnings summary
 */
const calculateTeacherEarnings = async (schoolId, year, month) => {
  try {
    // Create date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all payments for the month
    const payments = await Payment.find({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      createdAt: {
        $gte: startDate,
        $lte: endDate
      },
      classId: { $exists: true, $ne: null } // Only include payments with classId
    }).populate('classId', 'teacherId teacherCut name');

    // Group payments by class
    const classPayments = {};
    payments.forEach(payment => {
      // Skip payments without classId (like debt payments)
      if (!payment.classId || !payment.classId._id) {
        return;
      }
      
      const classId = payment.classId._id.toString();
      if (!classPayments[classId]) {
        classPayments[classId] = {
          classId: payment.classId._id,
          className: payment.classId.name,
          teacherId: payment.classId.teacherId,
          teacherCut: payment.classId.teacherCut,
          totalIncome: 0,
          payments: []
        };
      }
      classPayments[classId].totalIncome += payment.amount;
      classPayments[classId].payments.push(payment);
    });

    // Calculate teacher earnings for each class
    const teacherEarnings = {};
    const classSummaries = [];

    for (const classId in classPayments) {
      const classData = classPayments[classId];
      const teacherCut = classData.teacherCut;
      let teacherEarning = 0;

      if (teacherCut && teacherCut.mode && teacherCut.value !== undefined) {
        if (teacherCut.mode === 'percentage') {
          teacherEarning = (classData.totalIncome * teacherCut.value) / 100;
        } else if (teacherCut.mode === 'fixed') {
          teacherEarning = teacherCut.value;
        }
      }

      // Group by teacher
      const teacherId = classData.teacherId.toString();
      if (!teacherEarnings[teacherId]) {
        teacherEarnings[teacherId] = {
          teacherId: classData.teacherId,
          totalEarnings: 0,
          classes: []
        };
      }

      teacherEarnings[teacherId].totalEarnings += teacherEarning;
      teacherEarnings[teacherId].classes.push({
        classId: classData.classId,
        className: classData.className,
        classIncome: classData.totalIncome,
        teacherEarning: teacherEarning,
        teacherCut: teacherCut
      });

      classSummaries.push({
        classId: classData.classId,
        className: classData.className,
        teacherId: classData.teacherId,
        totalIncome: classData.totalIncome,
        teacherEarning: teacherEarning,
        teacherCut: teacherCut
      });
    }

    // Calculate total teacher earnings
    const totalTeacherEarnings = Object.values(teacherEarnings)
      .reduce((sum, teacher) => sum + teacher.totalEarnings, 0);

    return {
      totalTeacherEarnings,
      teacherEarnings: Object.values(teacherEarnings),
      classSummaries,
      month: month,
      year: year,
      schoolId: schoolId
    };

  } catch (error) {
    console.error('Error calculating teacher earnings:', error);
    throw error;
  }
};

/**
 * Get teacher earnings for a specific teacher in a month
 * @param {ObjectId} schoolId - School ID
 * @param {ObjectId} teacherId - Teacher ID
 * @param {Number} year - Year
 * @param {Number} month - Month (1-12)
 * @returns {Object} Teacher earnings for the month
 */
const getTeacherEarningsForMonth = async (schoolId, teacherId, year, month) => {
  try {
    const earnings = await calculateTeacherEarnings(schoolId, year, month);
    const teacherEarning = earnings.teacherEarnings.find(
      t => t.teacherId.toString() === teacherId.toString()
    );

    return teacherEarning || {
      teacherId: teacherId,
      totalEarnings: 0,
      classes: []
    };
  } catch (error) {
    console.error('Error getting teacher earnings for month:', error);
    throw error;
  }
};

module.exports = {
  calculateTeacherEarnings,
  getTeacherEarningsForMonth
};

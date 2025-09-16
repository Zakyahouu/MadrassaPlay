// server/services/monthlyAggregationService.js

const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const ManualTransaction = require('../models/ManualTransaction');
const TeacherPayout = require('../models/TeacherPayout');
const StudentFinancial = require('../models/StudentFinancial');
const EmployeeSalaryTransaction = require('../models/EmployeeSalaryTransaction');
const MonthlyFinancialSummary = require('../models/MonthlyFinancialSummary');
const { calculateTeacherEarnings } = require('./teacherPayoutService');

/**
 * Aggregates and freezes financial data for a specific month
 * @param {string} schoolId - The school ID
 * @param {number} year - The year
 * @param {number} month - The month (1-12)
 * @param {string} frozenBy - User ID who is freezing the month
 * @returns {Promise<Object>} The frozen summary data
 */
const freezeMonthlyData = async (schoolId, year, month, frozenBy) => {
  try {
    const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Aggregate student payments
    const studentPaymentsData = await Payment.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const studentPayments = studentPaymentsData.length > 0 ? studentPaymentsData[0] : { count: 0, totalAmount: 0 };

    // 2. Aggregate manual transactions
    const manualTransactionsData = await ManualTransaction.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const incomeData = manualTransactionsData.find(t => t._id === 'income') || { count: 0, totalAmount: 0 };
    const expenseData = manualTransactionsData.find(t => t._id === 'expense') || { count: 0, totalAmount: 0 };

    // 3. Aggregate teacher payouts
    const teacherPayoutsData = await TeacherPayout.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          year,
          month
        }
      },
      {
        $group: {
          _id: null,
          totalCalculated: { $sum: '$calculatedIncome' },
          totalPaid: { $sum: '$paidAmount' },
          totalRemaining: { $sum: '$remainingDebt' },
          teacherCount: { $addToSet: '$teacherId' }
        }
      }
    ]);

    const teacherPayouts = teacherPayoutsData.length > 0 ? {
      ...teacherPayoutsData[0],
      teacherCount: teacherPayoutsData[0].teacherCount.length,
      totalPaid: teacherPayoutsData[0].totalPaid
    } : { totalCalculated: 0, totalPaid: 0, totalRemaining: 0, teacherCount: 0 };

    // 4. Aggregate employee salaries
    const employeeSalariesData = await EmployeeSalaryTransaction.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          year,
          month
        }
      },
      {
        $group: {
          _id: null,
          totalCalculated: { $sum: '$calculatedSalary' },
          totalPaid: { $sum: '$paidAmount' },
          totalRemaining: { $sum: '$remaining' },
          employeeCount: { $addToSet: '$employeeId' }
        }
      }
    ]);

    const employeeSalaries = employeeSalariesData.length > 0 ? {
      ...employeeSalariesData[0],
      employeeCount: employeeSalariesData[0].employeeCount.length,
      totalPaid: employeeSalariesData[0].totalPaid
    } : { totalCalculated: 0, totalPaid: 0, totalRemaining: 0, employeeCount: 0 };

    // 5. Aggregate student debts
    const studentDebtsData = await StudentFinancial.aggregate([
      {
        $match: { schoolId: schoolIdObj }
      },
      {
        $group: {
          _id: null,
          totalDebt: { $sum: '$debt' },
          studentCount: { $sum: 1 }
        }
      }
    ]);

    const studentDebts = studentDebtsData.length > 0 ? studentDebtsData[0] : { totalDebt: 0, studentCount: 0 };

    // 6. Calculate totals
    const totalIncome = studentPayments.totalAmount + incomeData.totalAmount;
    const totalExpenses = expenseData.totalAmount;
    const manualIncome = incomeData.totalAmount;
    const teacherEarnings = teacherPayouts.totalCalculated;
    const employeeSalariesPaid = employeeSalaries.totalPaid;
    const totalStaffSalariesPaid = teacherPayouts.totalPaid + employeeSalaries.totalPaid;
    const netBalance = totalIncome - totalExpenses - totalStaffSalariesPaid;

    // 7. Create or update the monthly summary
    const summary = await MonthlyFinancialSummary.findOneAndUpdate(
      { schoolId: schoolIdObj, year, month },
      {
        schoolId: schoolIdObj,
        year,
        month,
        totalIncome,
        totalExpenses,
        totalDebts: studentDebts.totalDebt,
        teacherEarnings,
        manualIncome,
        totalStaffSalariesPaid,
        employeeCount: employeeSalaries.employeeCount,
        teacherCount: teacherPayouts.teacherCount,
        netBalance,
        lastCalculated: new Date(),
        isCalculated: true,
        isFrozen: true,
        frozenAt: new Date(),
        frozenBy: new mongoose.Types.ObjectId(frozenBy),
        snapshotData: {
          studentPayments: {
            count: studentPayments.count,
            totalAmount: studentPayments.totalAmount
          },
          manualTransactions: {
            incomeCount: incomeData.count,
            incomeAmount: incomeData.totalAmount,
            expenseCount: expenseData.count,
            expenseAmount: expenseData.totalAmount
          },
          teacherPayouts: {
            totalCalculated: teacherPayouts.totalCalculated,
            totalPaid: teacherPayouts.totalPaid,
            totalRemaining: teacherPayouts.totalRemaining,
            teacherCount: teacherPayouts.teacherCount
          },
          employeeSalaries: {
            totalCalculated: employeeSalaries.totalCalculated,
            totalPaid: employeeSalaries.totalPaid,
            totalRemaining: employeeSalaries.totalRemaining,
            employeeCount: employeeSalaries.employeeCount
          },
          studentDebts: {
            totalDebt: studentDebts.totalDebt,
            studentCount: studentDebts.studentCount
          }
        }
      },
      { upsert: true, new: true }
    );

    return {
      success: true,
      data: {
        summary,
        message: `Month ${month}/${year} has been frozen successfully`
      }
    };

  } catch (error) {
    console.error('Error freezing monthly data:', error);
    throw new Error(`Failed to freeze monthly data: ${error.message}`);
  }
};

/**
 * Gets financial data for a month (frozen if available, live if current)
 * @param {string} schoolId - The school ID
 * @param {number} year - The year
 * @param {number} month - The month (1-12)
 * @returns {Promise<Object>} The financial data
 */
const getMonthlyFinancialData = async (schoolId, year, month) => {
  try {
    const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

    // If it's the current month, always calculate live
    if (isCurrentMonth) {
      return await calculateLiveFinancialData(schoolId, year, month);
    }

    // For historical months, try to get frozen data first
    const frozenSummary = await MonthlyFinancialSummary.getFrozenSummary(schoolId, year, month);
    
    if (frozenSummary) {
      return {
        success: true,
        data: {
          ...frozenSummary.toObject(),
          isFrozen: true,
          dataSource: 'frozen'
        }
      };
    }

    // If no frozen data, calculate live
    return await calculateLiveFinancialData(schoolId, year, month);

  } catch (error) {
    console.error('Error getting monthly financial data:', error);
    throw new Error(`Failed to get monthly financial data: ${error.message}`);
  }
};

/**
 * Calculates live financial data for a month
 * @param {string} schoolId - The school ID
 * @param {number} year - The year
 * @param {number} month - The month (1-12)
 * @returns {Promise<Object>} The live financial data
 */
const calculateLiveFinancialData = async (schoolId, year, month) => {
  const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Calculate student payments (only actual money received, exclude debt payments)
  const studentPaymentsData = await Payment.aggregate([
    {
      $match: {
        schoolId: schoolIdObj,
        createdAt: { $gte: startDate, $lte: endDate },
        kind: { $ne: 'debt_payment' }, // Exclude debt payments
        classId: { $exists: true, $ne: null } // Only include class-based payments
      }
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: '$taken' }, // Use 'taken' field (actual money received)
        paymentCount: { $sum: 1 }
      }
    }
  ]);

  const totalIncome = studentPaymentsData.length > 0 ? studentPaymentsData[0].totalIncome : 0;
  const paymentCount = studentPaymentsData.length > 0 ? studentPaymentsData[0].paymentCount : 0;

  // Calculate manual expenses
  const manualExpensesData = await ManualTransaction.aggregate([
    {
      $match: {
        schoolId: schoolIdObj,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' }
      }
    }
  ]);

  const totalExpenses = manualExpensesData.length > 0 ? manualExpensesData[0].totalExpenses : 0;

  // Calculate manual income
  const manualIncomeData = await ManualTransaction.aggregate([
    {
      $match: {
        schoolId: schoolIdObj,
        type: 'income',
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: '$amount' }
      }
    }
  ]);

  const manualIncome = manualIncomeData.length > 0 ? manualIncomeData[0].totalIncome : 0;

  // Calculate teacher payouts (paid amounts only)
  const teacherPayoutsData = await TeacherPayout.aggregate([
    {
      $match: {
        schoolId: schoolIdObj,
        year,
        month
      }
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: '$paidAmount' },
        teacherCount: { $addToSet: '$teacherId' }
      }
    }
  ]);

  const totalTeacherEarningsPaid = teacherPayoutsData.length > 0 ? teacherPayoutsData[0].totalPaid : 0;
  const teacherCount = teacherPayoutsData.length > 0 ? teacherPayoutsData[0].teacherCount.length : 0;

  // Calculate employee salaries (paid amounts only)
  const employeeSalariesData = await EmployeeSalaryTransaction.aggregate([
    {
      $match: {
        schoolId: schoolIdObj,
        year,
        month
      }
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: '$paidAmount' },
        totalCalculated: { $sum: '$calculatedSalary' },
        employeeCount: { $addToSet: '$employeeId' }
      }
    }
  ]);

  const totalEmployeeSalariesPaid = employeeSalariesData.length > 0 ? employeeSalariesData[0].totalPaid : 0;
  const totalEmployeeSalariesCalculated = employeeSalariesData.length > 0 ? employeeSalariesData[0].totalCalculated : 0;
  const employeeCount = employeeSalariesData.length > 0 ? employeeSalariesData[0].employeeCount.length : 0;

  // Get calculated teacher earnings for transparency
  const teacherEarningsData = await calculateTeacherEarnings(schoolId, year, month);
  const totalTeacherEarningsCalculated = teacherEarningsData.totalTeacherEarnings;

  // Calculate student debts
  const debtData = await StudentFinancial.aggregate([
    {
      $match: { schoolId: schoolIdObj }
    },
    {
      $group: {
        _id: null,
        totalDebts: { $sum: '$debt' }
      }
    }
  ]);

  const totalDebts = debtData.length > 0 ? debtData[0].totalDebts : 0;

  // Calculate net balance (using only paid amounts)
  const netBalance = totalIncome + manualIncome - totalExpenses - totalTeacherEarningsPaid - totalEmployeeSalariesPaid;
  const totalStaffSalariesPaid = totalTeacherEarningsPaid + totalEmployeeSalariesPaid;
  const totalStaffSalariesCalculated = totalTeacherEarningsCalculated + totalEmployeeSalariesCalculated;

  return {
    success: true,
    data: {
      month,
      year,
      totalIncome,
      totalExpenses,
      totalDebts,
      teacherEarnings: totalTeacherEarningsPaid,
      employeeSalaries: totalEmployeeSalariesPaid,
      teacherEarningsCalculated: totalTeacherEarningsCalculated,
      employeeSalariesCalculated: totalEmployeeSalariesCalculated,
      manualIncome,
      netBalance,
      paymentCount,
      totalStaffSalariesPaid,
      totalStaffSalariesCalculated,
      teacherCount,
      employeeCount,
      lastCalculated: new Date(),
      isFrozen: false,
      dataSource: 'live'
    }
  };
};

module.exports = {
  freezeMonthlyData,
  getMonthlyFinancialData,
  calculateLiveFinancialData
};

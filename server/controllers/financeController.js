// server/controllers/financeController.js

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const StudentFinancial = require('../models/StudentFinancial');
const MonthlyFinancialSummary = require('../models/MonthlyFinancialSummary');
const TeacherPayout = require('../models/TeacherPayout');
const ManualTransaction = require('../models/ManualTransaction');
const Class = require('../models/Class');
const User = require('../models/User');
const EmployeeSalaryTransaction = require('../models/EmployeeSalaryTransaction');
const { calculateTeacherEarnings } = require('../services/teacherPayoutService');
const { freezeMonthlyData, getMonthlyFinancialData } = require('../services/monthlyAggregationService');
const LoggingService = require('../services/loggingService');

/**
 * @desc    Get financial overview for a specific month
 * @route   GET /api/finance/overview/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const getFinancialOverview = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  
  // Validate parameters
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: 'Invalid year or month' });
  }

  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    // Use the aggregation service to get financial data
    const result = await getMonthlyFinancialData(schoolId, yearNum, monthNum);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          ...result.data,
          monthName: new Date(yearNum, monthNum - 1).toLocaleDateString('en-US', { month: 'long' })
        }
      });
    } else {
      res.status(500).json({ message: 'Failed to get financial data' });
    }

  } catch (error) {
    console.error('Error getting financial overview:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get transactions for a specific month
 * @route   GET /api/finance/transactions/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  // Validate parameters
  const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: 'Invalid year or month' });
  }

  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    // Create date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Get transactions with pagination
    const transactions = await Payment.find({
      schoolId: schoolIdObj,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('studentId', 'firstName lastName studentCode')
    .populate({
      path: 'classId',
      select: 'name',
      options: { strictPopulate: false } // Allow null values
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Get total count for pagination
    const totalCount = await Payment.countDocuments({
      schoolId: schoolIdObj,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Format transactions for frontend
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      date: transaction.createdAt,
      student: {
        _id: transaction.studentId?._id,
        name: transaction.studentId ? `${transaction.studentId.firstName || ''} ${transaction.studentId.lastName || ''}`.trim() : 'Unknown Student',
        studentCode: transaction.studentId?.studentCode || 'N/A'
      },
      class: transaction.classId ? {
        _id: transaction.classId._id,
        name: transaction.classId.name
      } : {
        _id: null,
        name: 'Debt Payment'
      },
      amount: transaction.amount,
      kind: transaction.kind,
      method: transaction.method,
      note: transaction.note,
      debtDelta: transaction.debtDelta,
      expectedPrice: transaction.expectedPrice,
      taken: transaction.taken
    }));

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Recalculate monthly financial data
 * @route   POST /api/finance/calculate/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const recalculateMonthlyData = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  
  // Validate parameters
  const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: 'Invalid year or month' });
  }

  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    // Delete existing summary to force recalculation
    await MonthlyFinancialSummary.deleteOne({
      schoolId: schoolIdObj,
      year: yearNum,
      month: monthNum
    });

    // Call overview endpoint to recalculate
    await getFinancialOverview(req, res);

  } catch (error) {
    console.error('Error recalculating monthly data:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get teacher payouts for a specific month
 * @route   GET /api/finance/teachers/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const getTeacherPayouts = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  
  // Validate parameters
  const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: 'Invalid year or month' });
  }

  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    // First, ensure we have payout records for all active teachers
    await ensureTeacherPayoutRecords(schoolIdObj, yearNum, monthNum);

    // Get all teacher payouts for the month
    const teacherPayouts = await TeacherPayout.find({
      schoolId: schoolIdObj,
      year: yearNum,
      month: monthNum
    })
    .populate('teacherId', 'firstName lastName email')
    .populate('classId', 'name')
    .sort({ 'teacherId.firstName': 1, 'classId.name': 1 });

    // Group by teacher
    const teacherSummary = {};
    teacherPayouts.forEach(payout => {
      const teacherId = payout.teacherId._id.toString();
      if (!teacherSummary[teacherId]) {
        teacherSummary[teacherId] = {
          teacherId: payout.teacherId._id,
          teacherName: `${payout.teacherId.firstName} ${payout.teacherId.lastName}`,
          teacherEmail: payout.teacherId.email,
          totalCalculatedIncome: 0,
          totalPaidAmount: 0,
          totalRemainingDebt: 0,
          status: 'pending',
          classes: []
        };
      }
      
      teacherSummary[teacherId].totalCalculatedIncome += payout.calculatedIncome;
      teacherSummary[teacherId].totalPaidAmount += payout.paidAmount;
      teacherSummary[teacherId].totalRemainingDebt += payout.remainingDebt;
      
      teacherSummary[teacherId].classes.push({
        classId: payout.classId._id,
        className: payout.classData.className,
        calculatedIncome: payout.calculatedIncome,
        paidAmount: payout.paidAmount,
        remainingDebt: payout.remainingDebt,
        status: payout.status,
        totalStudents: payout.classData.totalStudents,
        studentsPaid: payout.classData.studentsPaid
      });
    });

    // Update status for each teacher
    Object.values(teacherSummary).forEach(teacher => {
      if (teacher.totalPaidAmount === 0) {
        teacher.status = 'pending';
      } else if (teacher.totalPaidAmount >= teacher.totalCalculatedIncome) {
        teacher.status = 'paid';
      } else {
        teacher.status = 'partial';
      }
    });

    res.json({
      success: true,
      data: {
        month: monthNum,
        year: yearNum,
        teachers: Object.values(teacherSummary)
      }
    });

  } catch (error) {
    console.error('Error getting teacher payouts:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Record a teacher payout
 * @route   POST /api/finance/teachers/pay/:teacherId
 * @access  Private (Manager)
 */
const recordTeacherPayout = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const { amount, classId, note = '', method = 'cash' } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Valid payout amount is required' });
  }

  if (!classId) {
    return res.status(400).json({ message: 'Class ID is required' });
  }

  // Validate teacher ID
  const teacherIdObj = new mongoose.Types.ObjectId(teacherId);
  const classIdObj = new mongoose.Types.ObjectId(classId);
  
  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const schoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }
  
  // If no schoolId from user, try to get it from the first school in the database (for testing)
  let schoolIdObj;
  if (schoolId) {
    schoolIdObj = new mongoose.Types.ObjectId(schoolId);
  } else {
    // Fallback: get the first school from the database
    const School = require('../models/School');
    const firstSchool = await School.findOne();
    if (!firstSchool) {
      return res.status(404).json({ message: 'No school found' });
    }
    schoolIdObj = firstSchool._id;
  }

  try {
    // Find the teacher payout record
    const teacherPayout = await TeacherPayout.findOne({
      schoolId: schoolIdObj,
      teacherId: teacherIdObj,
      classId: classIdObj,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    });

    if (!teacherPayout) {
      return res.status(404).json({ message: 'Teacher payout record not found' });
    }

    // Add the payout
    teacherPayout.addPayout(amount, req.user._id, note, method);
    await teacherPayout.save();

    res.json({
      success: true,
      data: {
        payout: teacherPayout,
        message: 'Payout recorded successfully'
      }
    });

  } catch (error) {
    console.error('Error recording teacher payout:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get teacher payout details
 * @route   GET /api/finance/teachers/:teacherId/:year/:month
 * @access  Private (Manager)
 */
const getTeacherPayoutDetails = asyncHandler(async (req, res) => {
  const { teacherId, year, month } = req.params;
  
  const teacherIdObj = new mongoose.Types.ObjectId(teacherId);
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: 'Invalid year or month' });
  }

  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const schoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }
  
  // If no schoolId from user, try to get it from the first school in the database (for testing)
  let schoolIdObj;
  if (schoolId) {
    schoolIdObj = new mongoose.Types.ObjectId(schoolId);
  } else {
    // Fallback: get the first school from the database
    const School = require('../models/School');
    const firstSchool = await School.findOne();
    if (!firstSchool) {
      return res.status(404).json({ message: 'No school found' });
    }
    schoolIdObj = firstSchool._id;
  }

  try {
    // First, ensure we have payout records for this teacher
    await ensureTeacherPayoutRecords(schoolIdObj, yearNum, monthNum);
    
    // Get teacher summary
    const teacherSummary = await TeacherPayout.getTeacherSummary(schoolIdObj, teacherId, yearNum, monthNum);
    
    // Get detailed payout records
    const payoutDetails = await TeacherPayout.find({
      schoolId: schoolIdObj,
      teacherId: teacherIdObj,
      year: yearNum,
      month: monthNum
    })
    .populate('classId', 'name')
    .populate('payoutHistory.paidBy', 'firstName lastName')
    .sort({ 'classId.name': 1 });


    res.json({
      success: true,
      data: {
        teacherSummary,
        payoutDetails
      }
    });

  } catch (error) {
    console.error('Error getting teacher payout details:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * Helper function to ensure teacher payout records exist
 */
const ensureTeacherPayoutRecords = async (schoolId, year, month) => {
  try {
    // Get all active classes for this school
    const classes = await Class.find({ 
      schoolId: schoolId,
      status: 'active',
      teacherId: { $exists: true }
    }).populate('teacherId', 'firstName lastName');

    for (const classItem of classes) {
      // Check if payout record already exists
      const existingPayout = await TeacherPayout.findOne({
        schoolId: schoolId,
        teacherId: classItem.teacherId._id,
        classId: classItem._id,
        year: year,
        month: month
      });

      if (!existingPayout) {
        // Calculate teacher earnings for this class
        const earningsData = await calculateTeacherEarnings(schoolId.toString(), year, month);
        const classEarnings = earningsData.classSummaries.find(
          c => c.classId.toString() === classItem._id.toString()
        );

        // Get class payment data
        const classPayments = await Payment.find({
          schoolId: schoolId,
          classId: classItem._id,
          createdAt: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0, 23, 59, 59, 999)
          }
        });

        const totalClassIncome = classPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const studentsPaid = new Set(classPayments.map(p => p.studentId.toString())).size;

        // Create payout record
        await TeacherPayout.create({
          schoolId: schoolId,
          teacherId: classItem.teacherId._id,
          classId: classItem._id,
          year: year,
          month: month,
          calculatedIncome: classEarnings ? classEarnings.teacherEarning : 0,
          paidAmount: 0,
          remainingDebt: classEarnings ? classEarnings.teacherEarning : 0,
          status: 'pending',
          classData: {
            className: classItem.name,
            totalStudents: classItem.capacity || 0,
            studentsPaid: studentsPaid,
            totalClassIncome: totalClassIncome,
            teacherCutPercentage: classItem.teacherCut?.mode === 'percentage' ? classItem.teacherCut.value : 0,
            teacherCutFixed: classItem.teacherCut?.mode === 'fixed' ? classItem.teacherCut.value : 0,
            absenceRule: classItem.absenceRule || false
          }
        });
      }
    }
  } catch (error) {
    console.error('Error ensuring teacher payout records:', error);
    throw error;
  }
};

/**
 * @desc    Get manual transactions for a specific month
 * @route   GET /api/finance/transactions/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const getManualTransactions = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  const { category, type } = req.query;
  
  // Validate parameters
  const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: 'Invalid year or month' });
  }

  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    // Get manual transactions for the month
    const transactions = await ManualTransaction.getByMonth(schoolIdObj, yearNum, monthNum);
    
    // Apply filters
    let filteredTransactions = transactions;
    if (category) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    if (type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === type);
    }

    // Get monthly totals
    const totals = await ManualTransaction.getMonthlyTotals(schoolIdObj, yearNum, monthNum);
    const incomeTotal = totals.find(t => t._id === 'income')?.total || 0;
    const expenseTotal = totals.find(t => t._id === 'expense')?.total || 0;

    res.json({
      success: true,
      data: {
        transactions: filteredTransactions,
        totals: {
          income: incomeTotal,
          expense: expenseTotal,
          net: incomeTotal - expenseTotal
        },
        month: monthNum,
        year: yearNum
      }
    });

  } catch (error) {
    console.error('Error getting manual transactions:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Add a manual transaction
 * @route   POST /api/finance/transactions/add
 * @access  Private (Manager)
 */
const addManualTransaction = asyncHandler(async (req, res) => {
  const { schoolId, type, category, description, amount, receiptNumber, date } = req.body;
  
  // Validate required fields
  if (!schoolId || !type || !category || !description || !amount || !date) {
    return res.status(400).json({ 
      message: 'Missing required fields: schoolId, type, category, description, amount, date' 
    });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ message: 'Type must be either "income" or "expense"' });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than 0' });
  }

  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    const transaction = await ManualTransaction.create({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      type,
      category: category.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      receiptNumber: receiptNumber?.trim() || '',
      date: new Date(date),
      createdBy: req.user._id
    });

    // Populate the createdBy field for response
    await transaction.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: {
        transaction,
        message: 'Transaction added successfully'
      }
    });

  } catch (error) {
    console.error('Error adding manual transaction:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Delete a manual transaction
 * @route   DELETE /api/finance/transactions/delete/:id
 * @access  Private (Manager)
 */
const deleteManualTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid transaction ID' });
  }

  try {
    const transaction = await ManualTransaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
    const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
    
    // if (!userSchoolId || userSchoolId !== transaction.schoolId.toString()) {
    //   return res.status(403).json({ message: 'Access denied to this transaction' });
    // }

    await ManualTransaction.findByIdAndDelete(id);

    res.json({
      success: true,
      data: {
        message: 'Transaction deleted successfully'
      }
    });

  } catch (error) {
    console.error('Error deleting manual transaction:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Freeze a month's financial data
 * @route   POST /api/finance/freeze/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const freezeMonth = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  
  // Validate parameters
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: 'Invalid year or month' });
  }

  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    // Check if month is already frozen
    const existingSummary = await MonthlyFinancialSummary.findOne({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      year: yearNum,
      month: monthNum,
      isFrozen: true
    });

    if (existingSummary) {
      return res.status(400).json({ 
        message: `Month ${monthNum}/${yearNum} is already frozen`,
        data: {
          frozenAt: existingSummary.frozenAt,
          frozenBy: existingSummary.frozenBy
        }
      });
    }

    // Freeze the month
    const result = await freezeMonthlyData(schoolId, yearNum, monthNum, req.user._id);

    res.json({
      success: true,
      data: {
        ...result.data,
        frozenBy: {
          _id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`
        }
      }
    });

  } catch (error) {
    console.error('Error freezing month:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get income vs expenses for selected month
 * @route   GET /api/finance/analytics/trends/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const getIncomeExpenseTrends = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  
  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Get student payments (income)
    const incomeResult = await Payment.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$amount' }
        }
      }
    ]);

    // Get manual income
    const manualIncomeResult = await ManualTransaction.aggregate([
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

    // Get manual expenses
    const expenseResult = await ManualTransaction.aggregate([
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

    // Get teacher earnings
    const teacherEarningsResult = await TeacherPayout.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          year: yearNum,
          month: monthNum
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$calculatedIncome' }
        }
      }
    ]);

    // Get employee salaries
    const employeeSalariesResult = await EmployeeSalaryTransaction.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          year: yearNum,
          month: monthNum
        }
      },
      {
        $group: {
          _id: null,
          totalSalaries: { $sum: '$paidAmount' }
        }
      }
    ]);

    const studentIncome = incomeResult.length > 0 ? incomeResult[0].totalIncome : 0;
    const manualIncome = manualIncomeResult.length > 0 ? manualIncomeResult[0].totalIncome : 0;
    const expenses = expenseResult.length > 0 ? expenseResult[0].totalExpenses : 0;
    const teacherEarnings = teacherEarningsResult.length > 0 ? teacherEarningsResult[0].totalEarnings : 0;
    const employeeSalaries = employeeSalariesResult.length > 0 ? employeeSalariesResult[0].totalSalaries : 0;

    const totalIncome = studentIncome + manualIncome;
    const totalExpenses = expenses + teacherEarnings + employeeSalaries;
    const net = totalIncome - totalExpenses;

    const monthData = {
      month: monthNum,
      year: yearNum,
      monthName: startDate.toLocaleDateString('en-US', { month: 'long' }),
      income: totalIncome,
      expenses: totalExpenses,
      net: net,
      breakdown: {
        studentIncome,
        manualIncome,
        manualExpenses: expenses,
        teacherEarnings,
        employeeSalaries
      }
    };

    res.json({
      success: true,
      data: { monthData }
    });

  } catch (error) {
    console.error('Error getting income expense trends:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get teacher payout distribution
 * @route   GET /api/finance/analytics/teacher-payouts/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const getTeacherPayoutDistribution = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  
  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Get teacher payout data
    const payoutData = await TeacherPayout.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          year: yearNum,
          month: monthNum
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      {
        $unwind: '$teacher'
      },
      {
        $group: {
          _id: '$teacherId',
          teacherName: { $first: { $concat: ['$teacher.firstName', ' ', '$teacher.lastName'] } },
          totalCalculated: { $sum: '$calculatedIncome' },
          totalPaid: { $sum: '$paidAmount' },
          totalRemaining: { $sum: '$remainingDebt' },
          classCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalCalculated: -1 }
      }
    ]);

    res.json({
      success: true,
      data: { teachers: payoutData }
    });

  } catch (error) {
    console.error('Error getting teacher payout distribution:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get student debt trends for selected month
 * @route   GET /api/finance/analytics/debt-trends/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const getStudentDebtTrends = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  
  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Get total debt at end of month
    const debtResult = await StudentFinancial.aggregate([
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

    // Get new debts created in this month
    const newDebtResult = await Payment.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          createdAt: { $gte: startDate, $lte: endDate },
          type: 'debt'
        }
      },
      {
        $group: {
          _id: null,
          newDebt: { $sum: '$amount' }
        }
      }
    ]);

    const totalDebt = debtResult.length > 0 ? debtResult[0].totalDebt : 0;
    const studentCount = debtResult.length > 0 ? debtResult[0].studentCount : 0;
    const newDebt = newDebtResult.length > 0 ? newDebtResult[0].newDebt : 0;
    const avgDebtPerStudent = studentCount > 0 ? totalDebt / studentCount : 0;

    const monthData = {
      month: monthNum,
      year: yearNum,
      monthName: startDate.toLocaleDateString('en-US', { month: 'long' }),
      totalDebt,
      newDebt,
      studentCount,
      avgDebtPerStudent
    };

    res.json({
      success: true,
      data: { monthData }
    });

  } catch (error) {
    console.error('Error getting student debt trends:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get expense categories breakdown
 * @route   GET /api/finance/analytics/expense-categories/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const getExpenseCategories = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  
  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Get expense categories breakdown
    const categoryData = await ManualTransaction.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    res.json({
      success: true,
      data: { categories: categoryData }
    });

  } catch (error) {
    console.error('Error getting expense categories:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get employee salary analytics for a specific month
 * @route   GET /api/finance/analytics/employee-salaries/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const getEmployeeSalaryAnalytics = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;
  
  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId || userSchoolId !== schoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  try {
    const schoolIdObj = new mongoose.Types.ObjectId(schoolId);
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Get employee salary data for the month
    const salaryData = await EmployeeSalaryTransaction.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          year: yearNum,
          month: monthNum
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $group: {
          _id: '$employee.role',
          totalCalculated: { $sum: '$calculatedSalary' },
          totalPaid: { $sum: '$paidAmount' },
          totalRemaining: { $sum: '$remaining' },
          employeeCount: { $sum: 1 },
          employees: {
            $push: {
              name: '$employee.name',
              calculatedSalary: '$calculatedSalary',
              paidAmount: '$paidAmount',
              remaining: '$remaining',
              status: '$status'
            }
          }
        }
      },
      {
        $sort: { totalCalculated: -1 }
      }
    ]);

    // Get total employee salary summary
    const totalSummary = await EmployeeSalaryTransaction.aggregate([
      {
        $match: {
          schoolId: schoolIdObj,
          year: yearNum,
          month: monthNum
        }
      },
      {
        $group: {
          _id: null,
          totalCalculated: { $sum: '$calculatedSalary' },
          totalPaid: { $sum: '$paidAmount' },
          totalRemaining: { $sum: '$remaining' },
          employeeCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byRole: salaryData,
        summary: totalSummary.length > 0 ? totalSummary[0] : {
          totalCalculated: 0,
          totalPaid: 0,
          totalRemaining: 0,
          employeeCount: 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting employee salary analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get employee salary analytics',
      error: error.message 
    });
  }
});

module.exports = {
  getFinancialOverview,
  getTransactions,
  recalculateMonthlyData,
  getTeacherPayouts,
  recordTeacherPayout,
  getTeacherPayoutDetails,
  getManualTransactions,
  addManualTransaction,
  deleteManualTransaction,
  freezeMonth,
  getIncomeExpenseTrends,
  getTeacherPayoutDistribution,
  getStudentDebtTrends,
  getExpenseCategories,
  getEmployeeSalaryAnalytics
};
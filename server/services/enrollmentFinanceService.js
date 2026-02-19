const mongoose = require('mongoose');
const StudentFinancial = require('../models/StudentFinancial');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');

const toObjectId = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  try {
    return new mongoose.Types.ObjectId(value);
  } catch (_) {
    return undefined;
  }
};

const resolveUnitPrice = (snapshot = {}) => {
  if (!snapshot || typeof snapshot !== 'object') return null;
  if (snapshot.paymentModel === 'per_session') {
    return typeof snapshot.sessionPrice === 'number' && snapshot.sessionPrice > 0
      ? snapshot.sessionPrice
      : null;
  }
  if (snapshot.paymentModel === 'per_cycle') {
    if (typeof snapshot.cyclePrice === 'number' && typeof snapshot.cycleSize === 'number' && snapshot.cyclePrice > 0 && snapshot.cycleSize > 0) {
      return snapshot.cyclePrice / snapshot.cycleSize;
    }
  }
  return null;
};

const computeSettlement = async (enrollment, options = {}) => {
  if (!enrollment) throw new Error('computeSettlement requires enrollment');
  const enrollmentDoc = enrollment instanceof Enrollment ? enrollment : await Enrollment.findById(enrollment);
  if (!enrollmentDoc) throw new Error('Enrollment not found');

  const classDoc = options.classDoc || await Class.findById(enrollmentDoc.classId).select('absenceRule');
  const snapshot = enrollmentDoc.pricingSnapshot || {};
  const counters = enrollmentDoc.sessionCounters || { attended: 0, absent: 0 };
  const unitPrice = resolveUnitPrice(snapshot);
  const balanceSessions = Number(enrollmentDoc.balance || 0);
  const creditSessions = balanceSessions > 0 ? balanceSessions : 0;
  const owedSessions = balanceSessions < 0 ? Math.abs(balanceSessions) : 0;

  const chargedSessions = counters.attended + (classDoc?.absenceRule ? counters.absent : 0);

  const toAmount = (sessions) => {
    if (unitPrice === null) return null;
    return Number((sessions * unitPrice).toFixed(2));
  };

  return {
    enrollmentId: enrollmentDoc._id,
    studentId: enrollmentDoc.studentId,
    classId: enrollmentDoc.classId,
    pricingSnapshot: snapshot,
    absenceRule: !!classDoc?.absenceRule,
    sessionCounters: counters,
    chargedSessions,
    balanceSessions,
    creditSessions,
    creditAmount: toAmount(creditSessions),
    owedSessions,
    owedAmount: toAmount(owedSessions),
    unitPrice,
  };
};

const applyDebtAdjustment = async ({
  studentId,
  schoolId,
  enrollmentId,
  amount,
  kind = 'settlement',
  note,
  by,
  receiptId,
  session,
}) => {
  const numericAmount = Number(amount || 0);
  if (!numericAmount) return null;
  const schoolObjId = toObjectId(schoolId);
  const studentObjId = toObjectId(studentId);
  if (!schoolObjId || !studentObjId) throw new Error('applyDebtAdjustment requires valid schoolId and studentId');

  const opts = session ? { session } : {};

  const update = await StudentFinancial.findOneAndUpdate(
    { schoolId: schoolObjId, studentId: studentObjId },
    { $inc: { debt: numericAmount } },
    { upsert: true, new: true, ...opts }
  );

  if (enrollmentId) {
    await Enrollment.updateOne(
      { _id: enrollmentId },
      {
        $push: {
          financeAdjustments: {
            delta: numericAmount,
            kind,
            note,
            by,
            receiptId,
            at: new Date(),
          },
        },
      },
      opts
    );
  }

  return update;
};

module.exports = {
  computeSettlement,
  applyDebtAdjustment,
  resolveUnitPrice,
};

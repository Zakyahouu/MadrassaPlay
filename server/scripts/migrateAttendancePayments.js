/*
  Migration script: Backfill Class pricing model, Enrollment pricingSnapshot/sessionCounters,
  and prepare Attendance/Payment collections. Idempotent and supports dry-run.
*/
const mongoose = require('mongoose');
require('dotenv').config();
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');

async function run({ dryRun = true } = {}) {
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || undefined });
  let classesUpdated = 0;
  let enrollmentsUpdated = 0;

  // Update classes
  const classes = await Class.find({});
  for (const c of classes) {
    const needsPricing = !c.paymentModel || (c.paymentModel === 'per_session' && typeof c.sessionPrice !== 'number') || (c.paymentModel === 'per_cycle' && (!c.cycleSize || typeof c.cyclePrice !== 'number'));
    if (!c.paymentModel) {
      // Infer from legacy: if paymentCycle && price -> per_cycle, else per_session
      if (c.paymentCycle && c.price != null) {
        c.paymentModel = 'per_cycle';
        c.cycleSize = c.paymentCycle;
        c.cyclePrice = c.price;
      } else {
        c.paymentModel = 'per_session';
        c.sessionPrice = c.price || 0;
      }
    }
    if (needsPricing) classesUpdated++;
    if (!dryRun) await c.save();
  }

  // Update enrollments
  const enrollments = await Enrollment.find({});
  for (const e of enrollments) {
    const klass = classes.find(k => k._id.toString() === e.classId.toString());
    if (!klass) continue;
    if (!e.pricingSnapshot || !e.pricingSnapshot.paymentModel) {
      e.pricingSnapshot = {
        paymentModel: klass.paymentModel,
        sessionPrice: klass.sessionPrice,
        cycleSize: klass.cycleSize,
        cyclePrice: klass.cyclePrice,
      };
    }
    if (!e.sessionCounters) {
      e.sessionCounters = { attended: 0, absent: 0 };
    }
    enrollmentsUpdated++;
    if (!dryRun) await e.save();
  }

  await mongoose.connection.close();
  return { classesUpdated, enrollmentsUpdated, dryRun };
}

if (require.main === module) {
  run({ dryRun: process.argv.includes('--apply') ? false : true })
    .then((r) => { console.log('Migration summary:', r); process.exit(0); })
    .catch((e) => { console.error('Migration failed:', e); process.exit(1); });
}

module.exports = { run };

const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    thresholdPercent: { type: Number, required: true, min: 0, max: 100 },
    iconUrl: { type: String, default: '' },
  },
  { _id: false }
);

const templateBadgeSchema = new mongoose.Schema(
  {
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'GameTemplate', required: true, unique: true }, // one badge definition per template
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    evaluationMode: { type: String, enum: ['highestAttempt', 'firstAttempt'], default: 'highestAttempt' },
  variants: { type: [variantSchema], validate: v => Array.isArray(v) && v.length > 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure variant thresholds unique & sort descending before save
templateBadgeSchema.pre('save', function (next) {
  if (this.variants && this.variants.length) {
    const thresholds = new Set();
    const labels = new Set();
    for (const v of this.variants) {
      if (thresholds.has(v.thresholdPercent)) {
        return next(new Error('Duplicate variant thresholdPercent not allowed'));
      }
      if (labels.has(v.label)) {
        return next(new Error('Duplicate variant label not allowed'));
      }
      thresholds.add(v.thresholdPercent);
      labels.add(v.label);
    }
    this.variants.sort((a, b) => b.thresholdPercent - a.thresholdPercent);
  }
  next();
});

// Instance helper: given a percentage, return current and next variant info
templateBadgeSchema.methods.variantProgress = function (percentage) {
  if (!Array.isArray(this.variants) || !this.variants.length) return { current: null, next: null };
  const ordered = this.variants; // already sorted desc
  let current = null;
  for (const v of ordered) {
    if (percentage >= v.thresholdPercent) { current = v; break; }
  }
  if (!current) return { current: null, next: ordered[ordered.length - 1] };
  const currentIdx = ordered.findIndex(v => v.label === current.label);
  const next = currentIdx === 0 ? null : ordered[currentIdx - 1];
  return { current, next };
};

module.exports = mongoose.model('TemplateBadge', templateBadgeSchema);

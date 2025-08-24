const mongoose = require('mongoose');

const earnedTemplateBadgeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    templateBadge: { type: mongoose.Schema.Types.ObjectId, ref: 'TemplateBadge', required: true },
    variantLabel: { type: String, required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true }
);

earnedTemplateBadgeSchema.index({ user: 1, templateBadge: 1 }, { unique: true });

module.exports = mongoose.model('EarnedTemplateBadge', earnedTemplateBadgeSchema);

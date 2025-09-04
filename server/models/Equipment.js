// server/models/Equipment.js

const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
	{
		schoolId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'School',
			required: true,
			index: true
		},
		majorType: {
			type: String,
			required: true,
			trim: true,
		},
		itemName: {
			type: String,
			required: true,
			trim: true,
		},
		// Units with individual state and serial number (1..n)
		units: [
			{
				serial: { type: Number, required: true },
				name: { type: String, trim: true },
				state: { type: String, enum: ['Working Fine', 'Broken', 'Under Maintenance'], default: 'Working Fine' },
				notes: { type: String, trim: true }
			}
		],
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Unique per school: majorType + itemName
equipmentSchema.index({ schoolId: 1, majorType: 1, itemName: 1 }, { unique: true });

// Virtual quantity derived from units length
equipmentSchema.virtual('quantity').get(function () {
	return Array.isArray(this.units) ? this.units.length : 0;
});

module.exports = mongoose.model('Equipment', equipmentSchema);


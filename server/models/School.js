// server/models/School.js

const mongoose = require('mongoose');

// This is the blueprint for our School documents.
const schoolSchema = new mongoose.Schema(
  {
    // The 'name' of the school is a simple string and is required.
    // We also make it 'unique' to prevent creating two schools with the same name.
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Removes any extra whitespace from the beginning or end.
    },
    // We can add more details about the school later if needed,
    // like address, contact info, etc.
  },
  {
    // This option automatically adds 'createdAt' and 'updatedAt' timestamp fields.
    timestamps: true,
  }
);

// We compile our schema into a model named 'School'.
// Mongoose will create a 'schools' collection in the database for this model.
module.exports = mongoose.model('School', schoolSchema);

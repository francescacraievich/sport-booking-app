const mongoose = require("mongoose");

// sports field schema
const fieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true // removes extra spaces
    },
    sport: {
      type: String,
      required: true,
      enum: ["football", "volleyball", "basketball"] // allowed values
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    // list of available time slots (e.g. "10:00", "11:00")
    slots: [String]
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Field", fieldSchema);

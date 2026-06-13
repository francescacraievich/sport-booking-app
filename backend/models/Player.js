const mongoose = require("mongoose");

// player schema
const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true // removes extra spaces
    },
    surname: {
      type: String,
      required: true,
      trim: true
    },
    jerseyNumber: {
      type: Number,
      min: 0 // jersey number (optional)
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team", // used to link this document to Team
      required: true
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Player", playerSchema);

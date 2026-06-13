const mongoose = require("mongoose");

// tournament schema
const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true // removes extra spaces
    },
    sport: {
      type: String,
      required: true,
      enum: ["football", "volleyball", "basketball"] // allowed sports
    },
    maxTeams: {
      type: Number,
      required: true,
      min: 2 // at least 2 teams
    },
    startDate: {
      type: String, // tournament start date
      required: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,  // stores the ID of the user who created the tournament
      ref: "User", // linked to the "User" collection
      required: true
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Tournament", tournamentSchema);

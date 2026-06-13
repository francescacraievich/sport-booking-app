const mongoose = require("mongoose");

// match schema
const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,  // stores a tournament ID
      ref: "Tournament",  // linked to the Tournament collection
      required: true
    },
    homeTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true
    },
    awayTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true
    },
    date: {
      type: String, // match date
      required: true
    },
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      default: null // optional
    },
    status: {
      type: String,
      enum: ["upcoming", "played"], // match status
      default: "upcoming"
    },
    homeScore: {
      type: Number,
      default: null,
      min: 0
    },
    awayScore: {
      type: Number,
      default: null,
      min: 0 // away team goals
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Match", matchSchema);

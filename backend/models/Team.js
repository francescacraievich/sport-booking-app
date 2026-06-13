const mongoose = require("mongoose");

// team schema
const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true // removes extra spaces
    },
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament", // reference to the tournament
      required: true
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

// prevents teams with the same name in the same tournament
teamSchema.index(
  { name: 1, tournament: 1 },
  { unique: true }
);

module.exports = mongoose.model("Team", teamSchema);

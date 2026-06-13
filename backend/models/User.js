const mongoose = require("mongoose");

// user schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, // unique username
      trim: true,
      minlength: 3
    },
    password: {
      type: String,
      required: true,
      minlength: 6 // minimum password length
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    surname: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

module.exports = mongoose.model("User", userSchema);

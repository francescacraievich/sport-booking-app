const mongoose = require("mongoose");

// field booking schema
const bookingSchema = new mongoose.Schema(
  {
    field: {
      type: mongoose.Schema.Types.ObjectId,  // sports field ID
      ref: "Field", // linked to the "Field" collection
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference to the user
      required: true
    },
    date: {
      type: String, // booking date
      required: true
    },
    slot: {
      type: String, // time slot
      required: true
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
);

// prevents duplicate bookings for the same field/date/slot
bookingSchema.index(
  { field: 1, date: 1, slot: 1 },
  { unique: true }
);

module.exports = mongoose.model("Booking", bookingSchema);

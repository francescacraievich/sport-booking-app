const express = require("express");
const router = express.Router();

const Field = require("../models/Field");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

// helper for error responses
function error(res, status, message) {
  return res.status(status).json({ error: message });
}

// validates YYYY-MM-DD date format
function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// validates HH:MM slot format
function isValidSlot(slot) {
  return /^\d{2}:\d{2}$/.test(slot);
}

// FIELD LIST
router.get("/fields", async (req, res) => {
  try {
    const { q = "", sport = "" } = req.query;
    const filter = {};

    // search by name or address
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } }
      ];
    }

    // sport filter
    if (sport) {
      filter.sport = { $regex: `^${sport}$`, $options: "i" };
    }

    const fields = await Field.find(filter);
    return res.json(fields);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

// FIELD DETAIL
router.get("/fields/:id", async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);

    if (!field) {
      return error(res, 404, "Field not found");
    }

    return res.json(field);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

// ================= AVAILABLE SLOTS =================
router.get("/fields/:id/slots", async (req, res) => {
  try {
    const { date } = req.query; // requested date (e.g. 2025-01-10)

    // basic checks
    if (!date) {
      return error(res, 400, "date parameter is required");
    }

    if (!isValidDate(date)) {
      return error(res, 400, "Invalid date format");
    }

    // retrieve the field from the database
    const field = await Field.findById(req.params.id);

    if (!field) {
      return error(res, 404, "Field not found");
    }

    // get all bookings for that field on that date
    const bookings = await Booking.find({
      field: field._id,
      date
    });

    // build the slot list with free/busy status
    const slots = [];

    for (let i = 0; i < field.slots.length; i++) {
      const slot = field.slots[i]; // e.g. "10:00"

      // check if a booking exists for this slot
      const booking = bookings.find(
        (booking) => booking.slot === slot
      );

      // add the slot with availability info
      slots.push({
        slot,
        available: !booking, // true if not found → free
        bookingId: booking ? booking._id : null, // booking id if it exists
        bookingUserId: booking ? booking.user : null // booking user id
      });
    }

    // final response to the frontend
    return res.json({
      fieldId: field._id,
      date,
      slots
    });

  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

// CREATE BOOKING
router.post("/fields/:id/bookings", auth, async (req, res) => {
  try {
    const { date, slot } = req.body;

    if (!date || !slot) {
      return error(res, 400, "date and slot are required");
    }

    if (!isValidDate(date)) {
      return error(res, 400, "Invalid date format");
    }

    if (!isValidSlot(slot)) {
      return error(res, 400, "Invalid slot format");
    }

    const field = await Field.findById(req.params.id);

    if (!field) {
      return error(res, 404, "Field not found");
    }

    // the slot must belong to the field's slots
    if (!field.slots.includes(slot)) {
      return error(res, 400, "Invalid slot");
    }

    // block bookings in the past
    const bookingDateTime = new Date(`${date}T${slot}:00`);  // creates a full date by combining day (date) and time (slot)

    if (bookingDateTime <= new Date()) {
      return error(res, 400, "You cannot book past slots");
    }

    const booking = await Booking.create({
      field: field._id,
      user: req.user.id,
      date,
      slot
    });

    return res.status(201).json(booking);
  } catch (err) {
    // unique index on field/date/slot
    if (err.code === 11000) {
      return error(res, 400, "Slot already booked");
    }

    console.error(err);
    return error(res, 500, "Server error");
  }
});

// CANCEL BOOKING
router.delete("/fields/:id/bookings/:bookingId", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return error(res, 404, "Booking not found");
    }

    // check that the booking belongs to the specified field
    if (booking.field.toString() !== req.params.id) {
      return error(res, 400, "Booking not associated with this field");
    }

    // only the owner can cancel it
    if (booking.user.toString() !== req.user.id) {
      return error(res, 403, "You can only cancel your own bookings");
    }

    // past bookings cannot be cancelled
    const bookingDateTime = new Date(`${booking.date}T${booking.slot}:00`);

    if (bookingDateTime <= new Date()) {
      return error(res, 400, "You can only cancel future bookings");
    }

    await booking.deleteOne();

    return res.json({ message: "Booking cancelled" });
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

module.exports = router;

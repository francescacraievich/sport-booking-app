const { Router } = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = Router();

// GET /api/bookings - Authenticated user's bookings (all, ordered by date desc)
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.date, b.field_id, b.slot_id,
              f.name AS field_name, f.sport_type, f.address,
              s.start_time, s.end_time
       FROM bookings b
       JOIN fields f ON b.field_id = f.id
       JOIN slots s ON b.slot_id = s.id
       WHERE b.user_id = $1
       ORDER BY b.date DESC, s.start_time ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

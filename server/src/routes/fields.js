const { Router } = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = Router();

// GET /api/fields?q=query - List fields, searchable
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query = 'SELECT * FROM fields';
    const params = [];

    if (q) {
      query += ' WHERE name ILIKE $1 OR sport_type ILIKE $1 OR address ILIKE $1';
      params.push(`%${q}%`);
    }

    query += ' ORDER BY name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fields/:id - Field details
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fields WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Field not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fields/:id/slots?date=YYYY-MM-DD - Available slots for a date
router.get('/:id/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date parameter required' });

    const slots = await pool.query(
      `SELECT s.*, b.id AS booking_id
       FROM slots s
       LEFT JOIN bookings b ON b.slot_id = s.id AND b.date = $2
       WHERE s.field_id = $1
       ORDER BY s.start_time`,
      [req.params.id, date]
    );

    res.json(slots.rows.map(s => ({
      ...s,
      available: !s.booking_id
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fields/:id/bookings - Book a slot
router.post('/:id/bookings', authenticate, async (req, res) => {
  try {
    const { slot_id, date } = req.body;
    if (!slot_id || !date) return res.status(400).json({ error: 'slot_id and date required' });

    // Check not in the past
    if (new Date(date) < new Date(new Date().toDateString())) {
      return res.status(400).json({ error: 'Cannot book past slots' });
    }

    // Check slot not already booked
    const existing = await pool.query(
      'SELECT id FROM bookings WHERE slot_id = $1 AND date = $2',
      [slot_id, date]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Slot already booked' });
    }

    const result = await pool.query(
      'INSERT INTO bookings (user_id, field_id, slot_id, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, req.params.id, slot_id, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/fields/:id/bookings/:bookingId - Cancel a booking
router.delete('/:id/bookings/:bookingId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.bookingId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or not yours' });
    }
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

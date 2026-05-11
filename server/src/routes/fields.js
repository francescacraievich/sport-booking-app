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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fields/:id - Field details
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fields WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Field not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fields/:id/slots?date=YYYY-MM-DD - Available slots for a date
// Includes booked_by so the client knows if the current user owns a booking
router.get('/:id/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date parameter required' });

    const slots = await pool.query(
      `SELECT s.*, b.id AS booking_id, b.user_id AS booked_by
       FROM slots s
       LEFT JOIN bookings b ON b.slot_id = s.id AND b.date = $2
       WHERE s.field_id = $1
       ORDER BY s.start_time`,
      [req.params.id, date]
    );

    res.json(
      slots.rows.map((s) => ({
        ...s,
        available: !s.booking_id,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fields/:id/bookings - Book a slot (authenticated)
router.post('/:id/bookings', authenticate, async (req, res) => {
  try {
    const { slot_id, date } = req.body;
    if (!slot_id || !date) return res.status(400).json({ error: 'slot_id and date required' });

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(date) < today) {
      return res.status(400).json({ error: 'Cannot book past slots' });
    }

    // Verify the slot belongs to this field (IDOR fix)
    const slotCheck = await pool.query(
      'SELECT id FROM slots WHERE id = $1 AND field_id = $2',
      [slot_id, req.params.id]
    );
    if (slotCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid slot for this field' });
    }

    // Let the DB UNIQUE constraint handle double-booking atomically (race condition fix)
    const result = await pool.query(
      'INSERT INTO bookings (user_id, field_id, slot_id, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, req.params.id, slot_id, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Slot already booked' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/fields/:id/bookings/:bookingId - Cancel a booking (authenticated, upcoming only)
router.delete('/:id/bookings/:bookingId', authenticate, async (req, res) => {
  try {
    const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.bookingId]);
    if (booking.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    if (booking.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your booking' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(booking.rows[0].date) < today) {
      return res.status(400).json({ error: 'Cannot cancel past bookings' });
    }

    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.bookingId]);
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const { Router } = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = Router();

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

// GET /api/fields?q=query
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
    console.error('GET /fields error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fields/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid field ID' });

    const result = await pool.query('SELECT * FROM fields WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Field not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /fields/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fields/:id/slots?date=YYYY-MM-DD
router.get('/:id/slots', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid field ID' });

    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date parameter required' });
    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const slots = await pool.query(
      `SELECT s.*, b.id AS booking_id, b.user_id AS booked_by
       FROM slots s
       LEFT JOIN bookings b ON b.slot_id = s.id AND b.date = $2
       WHERE s.field_id = $1
       ORDER BY s.start_time`,
      [id, date]
    );

    res.json(
      slots.rows.map((s) => ({
        ...s,
        available: !s.booking_id,
      }))
    );
  } catch (err) {
    console.error('GET /fields/:id/slots error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fields/:id/bookings
router.post('/:id/bookings', authenticate, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id, 10);
    if (isNaN(fieldId)) return res.status(400).json({ error: 'Invalid field ID' });

    const { slot_id, date } = req.body;
    if (!slot_id || !date) return res.status(400).json({ error: 'slot_id and date required' });

    const slotIdInt = parseInt(slot_id, 10);
    if (isNaN(slotIdInt)) return res.status(400).json({ error: 'Invalid slot_id' });

    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (new Date(date) < today) {
      return res.status(400).json({ error: 'Cannot book past slots' });
    }

    // Verify the slot belongs to this field (anti-IDOR)
    const slotCheck = await pool.query(
      'SELECT id FROM slots WHERE id = $1 AND field_id = $2',
      [slotIdInt, fieldId]
    );
    if (slotCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid slot for this field' });
    }

    // UNIQUE(slot_id, date) constraint handles double-booking atomically
    const result = await pool.query(
      'INSERT INTO bookings (user_id, field_id, slot_id, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, fieldId, slotIdInt, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Slot already booked' });
    }
    console.error('POST /fields/:id/bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/fields/:id/bookings/:bookingId
router.delete('/:id/bookings/:bookingId', authenticate, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id, 10);
    const bookingId = parseInt(req.params.bookingId, 10);
    if (isNaN(fieldId) || isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    // Verify booking belongs to both this field AND this user
    const booking = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND field_id = $2',
      [bookingId, fieldId]
    );
    if (booking.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    if (booking.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your booking' });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (new Date(booking.rows[0].date) < today) {
      return res.status(400).json({ error: 'Cannot cancel past bookings' });
    }

    await pool.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /fields/:id/bookings/:bookingId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

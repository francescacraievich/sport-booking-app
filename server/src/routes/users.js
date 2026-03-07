const { Router } = require('express');
const pool = require('../config/db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = Router();

// GET /api/users?q=query - List users (searchable)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query = 'SELECT id, username, name, surname FROM users';
    const params = [];

    if (q) {
      query += ' WHERE username ILIKE $1 OR name ILIKE $1 OR surname ILIKE $1';
      params.push(`%${q}%`);
    }

    query += ' ORDER BY username';
    const result = await pool.query(query, params);

    // For each user, get their tournaments
    const users = [];
    for (const user of result.rows) {
      const tournaments = await pool.query(
        'SELECT id, name, sport FROM tournaments WHERE creator_id = $1',
        [user.id]
      );
      users.push({ ...user, tournaments: tournaments.rows });
    }

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id - User details
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, name, surname FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const tournaments = await pool.query(
      'SELECT id, name, sport FROM tournaments WHERE creator_id = $1',
      [req.params.id]
    );

    res.json({ ...result.rows[0], tournaments: tournaments.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/whoami - Current user info
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, name, surname FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

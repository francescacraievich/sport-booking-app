const { Router } = require('express');
const pool = require('../config/db');

const router = Router();

// GET /api/users?q=query
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
    const usersResult = await pool.query(query, params);

    if (usersResult.rows.length === 0) return res.json([]);

    const userIds = usersResult.rows.map((u) => u.id);
    const tournamentsResult = await pool.query(
      'SELECT id, name, sport, creator_id FROM tournaments WHERE creator_id = ANY($1::int[])',
      [userIds]
    );

    const byUser = {};
    for (const t of tournamentsResult.rows) {
      if (!byUser[t.creator_id]) byUser[t.creator_id] = [];
      byUser[t.creator_id].push({ id: t.id, name: t.name, sport: t.sport });
    }

    const users = usersResult.rows.map((u) => ({
      ...u,
      tournaments: byUser[u.id] || [],
    }));

    res.json(users);
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });

    const result = await pool.query(
      'SELECT id, username, name, surname FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const tournaments = await pool.query(
      'SELECT id, name, sport FROM tournaments WHERE creator_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({ ...result.rows[0], tournaments: tournaments.rows });
  } catch (err) {
    console.error('GET /users/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const { Router } = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = Router();

// GET /api/tournaments/:tournamentId/teams/:teamId/players - List players
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM players WHERE team_id = $1 ORDER BY surname, name',
      [req.params.teamId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tournaments/:tournamentId/teams/:teamId/players - Add player
router.post('/', authenticate, async (req, res) => {
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [req.params.tournamentId]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.rows[0].creator_id !== req.user.id) return res.status(403).json({ error: 'Not the creator' });

    const { name, surname, jersey_number } = req.body;
    if (!name || !surname) return res.status(400).json({ error: 'name and surname required' });

    const result = await pool.query(
      'INSERT INTO players (team_id, name, surname, jersey_number) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.teamId, name, surname, jersey_number || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

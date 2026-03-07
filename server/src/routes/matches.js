const { Router } = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = Router();

// GET /api/matches/:id - Match details
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, t1.name AS team1_name, t2.name AS team2_name, f.name AS field_name,
              t.name AS tournament_name, t.sport
       FROM matches m
       JOIN teams t1 ON m.team1_id = t1.id
       JOIN teams t2 ON m.team2_id = t2.id
       JOIN tournaments t ON m.tournament_id = t.id
       LEFT JOIN fields f ON m.field_id = f.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Match not found' });

    const match = result.rows[0];
    match.status = match.score1 !== null ? 'played' : (new Date(match.date) < new Date() ? 'upcoming' : 'upcoming');

    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/matches/:id/result - Enter match result (creator only)
router.put('/:id/result', authenticate, async (req, res) => {
  try {
    const match = await pool.query(
      `SELECT m.*, t.creator_id FROM matches m JOIN tournaments t ON m.tournament_id = t.id WHERE m.id = $1`,
      [req.params.id]
    );
    if (match.rows.length === 0) return res.status(404).json({ error: 'Match not found' });
    if (match.rows[0].creator_id !== req.user.id) return res.status(403).json({ error: 'Not the tournament creator' });

    // Check match date has passed
    if (new Date(match.rows[0].date) > new Date()) {
      return res.status(400).json({ error: 'Match date has not passed yet' });
    }

    const { score1, score2 } = req.body;
    if (score1 === undefined || score2 === undefined) {
      return res.status(400).json({ error: 'score1 and score2 required' });
    }

    const result = await pool.query(
      'UPDATE matches SET score1 = $1, score2 = $2 WHERE id = $3 RETURNING *',
      [score1, score2, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

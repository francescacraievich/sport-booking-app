const { Router } = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = Router();

// GET /api/matches/:id - Match details
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, t1.name AS team1_name, t2.name AS team2_name, f.name AS field_name,
              t.name AS tournament_name, t.sport, t.creator_id
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
    match.status = match.score1 !== null ? 'played' : 'upcoming';

    res.json(match);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/matches/:id - Update match metadata: field, date (creator only, match not yet played)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const match = await pool.query(
      `SELECT m.*, t.creator_id FROM matches m JOIN tournaments t ON m.tournament_id = t.id WHERE m.id = $1`,
      [req.params.id]
    );
    if (match.rows.length === 0) return res.status(404).json({ error: 'Match not found' });
    if (match.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Not the tournament creator' });
    }
    if (match.rows[0].score1 !== null) {
      return res.status(409).json({ error: 'Cannot edit a match that already has a result' });
    }

    const { field_id, date } = req.body;

    if (field_id !== undefined && field_id !== null) {
      const fieldCheck = await pool.query('SELECT id FROM fields WHERE id = $1', [field_id]);
      if (fieldCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Field not found' });
      }
    }

    if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const result = await pool.query(
      `UPDATE matches SET
        field_id = COALESCE($1, field_id),
        date = COALESCE($2, date)
       WHERE id = $3 RETURNING *`,
      [field_id ?? null, date ?? null, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/matches/:id/result - Enter match result (creator only, after match date)
router.put('/:id/result', authenticate, async (req, res) => {
  try {
    const match = await pool.query(
      `SELECT m.*, t.creator_id FROM matches m JOIN tournaments t ON m.tournament_id = t.id WHERE m.id = $1`,
      [req.params.id]
    );
    if (match.rows.length === 0) return res.status(404).json({ error: 'Match not found' });
    if (match.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Not the tournament creator' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(match.rows[0].date) >= today) {
      return res.status(400).json({ error: 'Match date has not passed yet' });
    }

    if (match.rows[0].score1 !== null) {
      return res.status(409).json({ error: 'Result already entered for this match' });
    }

    const { score1, score2 } = req.body;
    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      return res.status(400).json({ error: 'score1 and score2 must be non-negative integers' });
    }

    const result = await pool.query(
      'UPDATE matches SET score1 = $1, score2 = $2 WHERE id = $3 RETURNING *',
      [s1, s2, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

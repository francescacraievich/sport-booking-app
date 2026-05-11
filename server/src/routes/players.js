const { Router } = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = Router({ mergeParams: true });

// GET /api/tournaments/:tournamentId/teams/:teamId/players
router.get('/', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId, 10);
    const teamId = parseInt(req.params.teamId, 10);
    if (isNaN(tournamentId) || isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const result = await pool.query(
      'SELECT * FROM players WHERE team_id = $1 ORDER BY surname, name',
      [teamId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET players error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tournaments/:tournamentId/teams/:teamId/players
router.post('/', authenticate, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId, 10);
    const teamId = parseInt(req.params.teamId, 10);
    if (isNaN(tournamentId) || isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.rows[0].creator_id !== req.user.id) return res.status(403).json({ error: 'Not the creator' });

    // Verify the team belongs to this tournament (anti-IDOR)
    const teamCheck = await pool.query(
      'SELECT id FROM teams WHERE id = $1 AND tournament_id = $2',
      [teamId, tournamentId]
    );
    if (teamCheck.rows.length === 0) return res.status(404).json({ error: 'Team not found in this tournament' });

    const { name, surname, jersey_number } = req.body;
    if (!name || !surname) return res.status(400).json({ error: 'name and surname required' });

    let jerseyNum = null;
    if (jersey_number !== undefined && jersey_number !== null && jersey_number !== '') {
      jerseyNum = parseInt(jersey_number, 10);
      if (isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99) {
        return res.status(400).json({ error: 'jersey_number must be an integer between 1 and 99' });
      }
      const dupCheck = await pool.query(
        'SELECT id FROM players WHERE team_id = $1 AND jersey_number = $2',
        [teamId, jerseyNum]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(409).json({ error: `Jersey number ${jerseyNum} is already taken in this team` });
      }
    }

    const result = await pool.query(
      'INSERT INTO players (team_id, name, surname, jersey_number) VALUES ($1, $2, $3, $4) RETURNING *',
      [teamId, name.trim(), surname.trim(), jerseyNum]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST players error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

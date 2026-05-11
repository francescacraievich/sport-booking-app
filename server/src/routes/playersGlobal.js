const { Router } = require('express');
const pool = require('../config/db');

const router = Router();

// GET /api/players?q=query - Global player search (required by spec: search for players)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query = `
      SELECT p.id, p.name, p.surname, p.jersey_number,
             tm.id AS team_id, tm.name AS team_name,
             t.id AS tournament_id, t.name AS tournament_name, t.sport
      FROM players p
      JOIN teams tm ON p.team_id = tm.id
      JOIN tournaments t ON tm.tournament_id = t.id
    `;
    const params = [];

    if (q) {
      query += ' WHERE p.name ILIKE $1 OR p.surname ILIKE $1';
      params.push(`%${q}%`);
    }

    query += ' ORDER BY p.surname, p.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

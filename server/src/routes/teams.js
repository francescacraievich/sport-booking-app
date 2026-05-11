const { Router } = require('express');
const pool = require('../config/db');

const router = Router();

// GET /api/teams?q=query - Global team search (required by spec: search for teams)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query = `
      SELECT tm.id, tm.name, tm.tournament_id,
             t.name AS tournament_name, t.sport
      FROM teams tm
      JOIN tournaments t ON tm.tournament_id = t.id
    `;
    const params = [];

    if (q) {
      query += ' WHERE tm.name ILIKE $1';
      params.push(`%${q}%`);
    }

    query += ' ORDER BY tm.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

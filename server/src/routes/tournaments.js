const { Router } = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = Router();

// Compute tournament status: 'upcoming' | 'active' | 'completed'
function computeStatus(startDate, totalMatches, playedMatches) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(startDate) > today) return 'upcoming';
  if (totalMatches > 0 && playedMatches === totalMatches) return 'completed';
  return 'active';
}

// GET /api/tournaments?q=query - List tournaments
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query = `SELECT t.*, u.username AS creator_username,
      (SELECT COUNT(*)::int FROM teams WHERE tournament_id = t.id) AS teams_count,
      (SELECT COUNT(*)::int FROM matches WHERE tournament_id = t.id) AS total_matches,
      (SELECT COUNT(*)::int FROM matches WHERE tournament_id = t.id AND score1 IS NOT NULL) AS played_matches
      FROM tournaments t JOIN users u ON t.creator_id = u.id`;
    const params = [];

    if (q) {
      query += ' WHERE t.name ILIKE $1 OR t.sport ILIKE $1';
      params.push(`%${q}%`);
    }

    query += ' ORDER BY t.created_at DESC';
    const result = await pool.query(query, params);
    const rows = result.rows.map(t => ({
      ...t,
      status: computeStatus(t.start_date, t.total_matches, t.played_matches),
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tournaments - Create tournament
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, sport, max_teams, start_date } = req.body;
    if (!name || !sport || !max_teams || !start_date) {
      return res.status(400).json({ error: 'name, sport, max_teams, and start_date required' });
    }

    const validSports = ['football', 'volleyball', 'basketball'];
    if (!validSports.includes(sport)) {
      return res.status(400).json({ error: 'Sport must be football, volleyball, or basketball' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const maxTeamsInt = parseInt(max_teams, 10);
    if (isNaN(maxTeamsInt) || maxTeamsInt < 2) {
      return res.status(400).json({ error: 'max_teams must be an integer >= 2' });
    }

    const result = await pool.query(
      'INSERT INTO tournaments (name, sport, max_teams, start_date, creator_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, sport, maxTeamsInt, start_date, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tournaments/:id - Tournament details
router.get('/:id', async (req, res) => {
  try {
    const tournament = await pool.query(
      'SELECT t.*, u.username AS creator_username FROM tournaments t JOIN users u ON t.creator_id = u.id WHERE t.id = $1',
      [req.params.id]
    );
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Tournament not found' });

    const teams = await pool.query(
      'SELECT * FROM teams WHERE tournament_id = $1 ORDER BY name',
      [req.params.id]
    );

    const matches = await pool.query(
      `SELECT m.*, t1.name AS team1_name, t2.name AS team2_name
       FROM matches m
       JOIN teams t1 ON m.team1_id = t1.id
       JOIN teams t2 ON m.team2_id = t2.id
       WHERE m.tournament_id = $1
       ORDER BY m.date, m.id`,
      [req.params.id]
    );

    const matchesWithStatus = matches.rows.map(m => ({
      ...m,
      status: m.score1 !== null ? 'played' : 'upcoming',
    }));

    const t = tournament.rows[0];
    const totalMatches = matchesWithStatus.length;
    const playedMatches = matchesWithStatus.filter(m => m.status === 'played').length;

    res.json({
      ...t,
      status: computeStatus(t.start_date, totalMatches, playedMatches),
      teams: teams.rows,
      matches: matchesWithStatus,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tournaments/:id - Edit tournament (creator only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.rows[0].creator_id !== req.user.id) return res.status(403).json({ error: 'Not the creator' });

    const { name, max_teams, start_date } = req.body;

    if (max_teams !== undefined) {
      const maxTeamsInt = parseInt(max_teams, 10);
      if (isNaN(maxTeamsInt) || maxTeamsInt < 2) {
        return res.status(400).json({ error: 'max_teams must be an integer >= 2' });
      }
      const teamCount = await pool.query(
        'SELECT COUNT(*)::int AS cnt FROM teams WHERE tournament_id = $1',
        [req.params.id]
      );
      if (maxTeamsInt < teamCount.rows[0].cnt) {
        return res.status(400).json({
          error: `Cannot reduce max_teams below current team count (${teamCount.rows[0].cnt})`,
        });
      }
    }

    const result = await pool.query(
      `UPDATE tournaments SET
        name = COALESCE($1, name),
        max_teams = COALESCE($2, max_teams),
        start_date = COALESCE($3, start_date)
       WHERE id = $4 RETURNING *`,
      [name, max_teams ?? null, start_date ?? null, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tournaments/:id - Delete tournament (creator only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.rows[0].creator_id !== req.user.id) return res.status(403).json({ error: 'Not the creator' });

    await pool.query('DELETE FROM tournaments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Tournament deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tournaments/:id/teams - Add team (creator only)
router.post('/:id/teams', authenticate, async (req, res) => {
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.rows[0].creator_id !== req.user.id) return res.status(403).json({ error: 'Not the creator' });

    const teamCount = await pool.query('SELECT COUNT(*) FROM teams WHERE tournament_id = $1', [req.params.id]);
    if (parseInt(teamCount.rows[0].count) >= tournament.rows[0].max_teams) {
      return res.status(400).json({ error: 'Maximum number of teams reached' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Team name required' });

    const result = await pool.query(
      'INSERT INTO teams (name, tournament_id) VALUES ($1, $2) RETURNING *',
      [name.trim(), req.params.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A team with this name already exists in the tournament' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tournaments/:id/matches/generate - Generate round-robin schedule
router.post('/:id/matches/generate', authenticate, async (req, res) => {
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.rows[0].creator_id !== req.user.id) return res.status(403).json({ error: 'Not the creator' });

    const teams = await pool.query('SELECT * FROM teams WHERE tournament_id = $1 ORDER BY id', [req.params.id]);
    if (teams.rows.length < tournament.rows[0].max_teams) {
      return res.status(400).json({
        error: `All teams must be registered before generating the schedule (${teams.rows.length}/${tournament.rows[0].max_teams})`,
      });
    }

    // Block regeneration if any match already has a result
    const playedCheck = await pool.query(
      'SELECT COUNT(*)::int AS cnt FROM matches WHERE tournament_id = $1 AND score1 IS NOT NULL',
      [req.params.id]
    );
    if (playedCheck.rows[0].cnt > 0) {
      return res.status(409).json({ error: 'Cannot regenerate schedule: some matches already have results' });
    }

    // Delete existing matches
    await pool.query('DELETE FROM matches WHERE tournament_id = $1', [req.params.id]);

    // Generate single round-robin
    const teamList = teams.rows;
    const matches = [];
    const startDate = new Date(tournament.rows[0].start_date);

    let matchDay = 0;
    for (let i = 0; i < teamList.length; i++) {
      for (let j = i + 1; j < teamList.length; j++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + matchDay);
        matches.push([req.params.id, teamList[i].id, teamList[j].id, date.toISOString().split('T')[0]]);
        matchDay++;
      }
    }

    for (const m of matches) {
      await pool.query(
        'INSERT INTO matches (tournament_id, team1_id, team2_id, date) VALUES ($1, $2, $3, $4)',
        m
      );
    }

    const result = await pool.query(
      `SELECT m.*, t1.name AS team1_name, t2.name AS team2_name
       FROM matches m
       JOIN teams t1 ON m.team1_id = t1.id
       JOIN teams t2 ON m.team2_id = t2.id
       WHERE m.tournament_id = $1
       ORDER BY m.date, m.id`,
      [req.params.id]
    );

    res.status(201).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tournaments/:id/matches - List matches
router.get('/:id/matches', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, t1.name AS team1_name, t2.name AS team2_name
       FROM matches m
       JOIN teams t1 ON m.team1_id = t1.id
       JOIN teams t2 ON m.team2_id = t2.id
       WHERE m.tournament_id = $1
       ORDER BY m.date, m.id`,
      [req.params.id]
    );
    const rows = result.rows.map(m => ({ ...m, status: m.score1 !== null ? 'played' : 'upcoming' }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tournaments/:id/standings - Tournament standings
router.get('/:id/standings', async (req, res) => {
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Tournament not found' });

    const sport = tournament.rows[0].sport;
    const teams = await pool.query('SELECT * FROM teams WHERE tournament_id = $1', [req.params.id]);
    const matches = await pool.query(
      'SELECT * FROM matches WHERE tournament_id = $1 AND score1 IS NOT NULL',
      [req.params.id]
    );

    const standings = {};
    for (const team of teams.rows) {
      standings[team.id] = {
        team_id: team.id,
        team_name: team.name,
        points: 0,
        matches_played: 0,
        goals_scored: 0,
        goals_conceded: 0,
        goal_difference: 0,
      };
    }

    for (const match of matches.rows) {
      const s1 = standings[match.team1_id];
      const s2 = standings[match.team2_id];
      if (!s1 || !s2) continue;

      s1.matches_played++;
      s2.matches_played++;
      s1.goals_scored += match.score1;
      s1.goals_conceded += match.score2;
      s2.goals_scored += match.score2;
      s2.goals_conceded += match.score1;

      if (sport === 'football') {
        if (match.score1 > match.score2) { s1.points += 3; }
        else if (match.score1 < match.score2) { s2.points += 3; }
        else { s1.points += 1; s2.points += 1; }
      } else {
        // volleyball, basketball: 2 points for win, 0 for loss
        if (match.score1 > match.score2) { s1.points += 2; }
        else if (match.score1 < match.score2) { s2.points += 2; }
      }
    }

    const sorted = Object.values(standings)
      .map(s => ({ ...s, goal_difference: s.goals_scored - s.goals_conceded }))
      .sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference);

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

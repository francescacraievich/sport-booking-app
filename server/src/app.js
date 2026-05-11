require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
const tournamentRoutes = require('./routes/tournaments');
const matchRoutes = require('./routes/matches');
const userRoutes = require('./routes/users');
const playerRoutes = require('./routes/players');
const bookingRoutes = require('./routes/bookings');
const teamSearchRoutes = require('./routes/teams');
const playerSearchRoutes = require('./routes/playersGlobal');
const { authenticate } = require('./middleware/auth');
const rateLimit = require('./middleware/rateLimit');

const app = express();

// Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
app.use(helmet());

// Note: CORS is not needed here — nginx reverse proxy serves both client and
// API from the same origin (localhost:8080), so the browser never makes a
// cross-origin request directly to this server.
app.use(express.json());
app.use(cookieParser());

// Auth endpoints: max 10 requests per minute per IP (brute-force protection)
app.use('/api/auth', rateLimit(60 * 1000, 10));
app.use('/api/auth', authRoutes);

// Resources
app.use('/api/fields', fieldRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);

// Global search endpoints (spec: search available for fields, tournaments, teams, players)
app.use('/api/teams', teamSearchRoutes);
app.use('/api/players', playerSearchRoutes);

// Nested player routes under tournaments/:tournamentId/teams/:teamId/players
app.use('/api/tournaments/:tournamentId/teams/:teamId/players', playerRoutes);

// GET /api/whoami
app.get('/api/whoami', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, name, surname FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /whoami error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

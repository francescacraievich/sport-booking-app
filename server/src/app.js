require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
const tournamentRoutes = require('./routes/tournaments');
const matchRoutes = require('./routes/matches');
const userRoutes = require('./routes/users');
const playerRoutes = require('./routes/players');
const { authenticate } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/users', userRoutes);

// Whoami endpoint
app.get('/api/whoami', authenticate, async (req, res) => {
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

// Player routes (nested under tournaments)
app.use('/api/tournaments/:tournamentId/teams/:teamId/players', (req, res, next) => {
  req.params.tournamentId = req.params.tournamentId;
  req.params.teamId = req.params.teamId;
  next();
}, playerRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

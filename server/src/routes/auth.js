const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  // secure: true  — enable when deployed over HTTPS
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password, name, surname } = req.body;
    if (!username || !password || !name || !surname) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-30 characters, letters, numbers, underscores and dots only',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!name.trim() || !surname.trim()) {
      return res.status(400).json({ error: 'Name and surname cannot be empty' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, name, surname) VALUES ($1, $2, $3, $4) RETURNING id, username, name, surname',
      [username, hash, name.trim(), surname.trim()]
    );

    const user = result.rows[0];
    res.cookie('token', signToken(user), COOKIE_OPTS);
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const safeUser = { id: user.id, username: user.username, name: user.name, surname: user.surname };
    res.cookie('token', signToken(safeUser), COOKIE_OPTS);
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/signout
router.post('/signout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Signed out' });
});

module.exports = router;

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function optionalAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Invalid token, continue without user
  }
  next();
}

module.exports = { authenticate, optionalAuth };

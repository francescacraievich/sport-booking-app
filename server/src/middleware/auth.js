const jwt = require('jsonwebtoken');

// Required authentication - rejects if no valid token
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token required' });

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Optional authentication - attaches user if token present, continues otherwise
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Invalid token, continue without user
  }
  next();
}

module.exports = { authenticate, optionalAuth };

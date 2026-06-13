const jwt = require("jsonwebtoken");

// authentication middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization; // Authorization header

  // check for token presence
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  // extract the token (remove "Bearer ")
  const token = authHeader.split(" ")[1];

  try {
    // verify the token with the secret key and extract its payload
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // save the user data in the request
    req.user = payload;

    next(); // pass to the next route
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = auth;

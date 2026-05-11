/**
 * Rate limiting middleware.
 * Takes two parameters: windowMs (interval in ms) and max (max requests per window).
 * Tracks requests per IP using a Map. Returns 429 with Retry-After header when exceeded.
 */
function rateLimit(windowMs, max) {
  // Map<ip, timestamp[]> — persists across requests via closure
  const requests = new Map();

  return function rateLimit(req, res, next) {
    const ip = req.ip;
    const now = Date.now();

    // Get existing timestamps for this IP, filter to current window
    const timestamps = (requests.get(ip) || []).filter(t => now - t < windowMs);

    if (timestamps.length >= max) {
      const retryAfterSec = Math.ceil(windowMs / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: `Too many requests. Try again in ${retryAfterSec} seconds.`,
      });
    }

    timestamps.push(now);
    requests.set(ip, timestamps);
    next();
  };
}

module.exports = rateLimit;

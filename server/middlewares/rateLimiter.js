import rateLimit from 'express-rate-limit';

/**
 * authLimiter
 * Strict Rate Limiting for Authentication endpoints (login, register).
 * Max 10 attempts per 15 minutes per IP to safeguard against brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return standard RateLimit headers in response
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: {
    error: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
    status: 429,
  },
});

/**
 * orderLimiter
 * Rate Limiting for Order placement (POST /api/orders).
 * Max 15 orders per hour per IP to prevent fake/spam orders and stock exhaustion.
 */
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 order creation requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Hourly order creation limit reached. Please wait before submitting additional orders or contact support.',
    status: 429,
  },
});

export default { authLimiter, orderLimiter };

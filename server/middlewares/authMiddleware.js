import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce_super_secure_jwt_secret_suffix_it_2026';

/**
 * Middleware: requireAuth
 * Enforces mandatory JWT authentication. Attaches verified user to req.user.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Please provide a valid Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Token missing.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token. Please log in again.',
      });
    }

    // Verify user exists and account is active
    const userResult = await pool.query(
      'SELECT id, name, email, phone, role, is_active FROM public.users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Account no longer exists.',
      });
    }

    const user = userResult.rows[0];
    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        error: 'Account has been deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: requireAdmin
 * Enforces Role-Based Access Control (RBAC).
 * Only accounts with role === 'admin' are permitted.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required before checking administrator privileges.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Administrator privileges required to access this resource.',
    });
  }

  next();
};

/**
 * Middleware: optionalAuth
 * Optionally extracts and verifies JWT token if provided.
 * If valid, attaches req.user. If absent or invalid, sets req.user = null and continues.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userResult = await pool.query(
        'SELECT id, name, email, phone, role, is_active FROM public.users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].is_active !== false) {
        req.user = userResult.rows[0];
      } else {
        req.user = null;
      }
    } catch (err) {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce_super_secure_jwt_secret_suffix_it_2026';

/**
 * Helper to generate JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'customer',
      phone: user.phone,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * POST /api/auth/register
 * Register a new customer account
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Full name is required.',
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : null;

    // Check if email already registered
    const existing = await pool.query(
      'SELECT id FROM public.users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.',
      });
    }

    // Hash password with bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into PostgreSQL
    const insertQuery = `
      INSERT INTO public.users (name, email, phone, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, 'customer', true)
      RETURNING id, name, email, phone, role, is_active, created_at;
    `;

    const result = await pool.query(insertQuery, [
      name.trim(),
      normalizedEmail,
      cleanPhone,
      passwordHash,
    ]);

    const newUser = result.rows[0];
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate existing user with email and password
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Both email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user
    const userResult = await pool.query(
      'SELECT * FROM public.users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Check password
    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        error: 'No password set for this account. Please use password reset or register.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'customer',
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Retrieve the current authenticated user's profile
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is populated by requireAuth middleware
    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

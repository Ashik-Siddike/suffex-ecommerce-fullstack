import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer account (Rate limited: 10 per 15 min)
 * @access  Public
 */
router.post('/register', authLimiter, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login customer/admin & return JWT token (Rate limited: 10 per 15 min)
 * @access  Public
 */
router.post('/login', authLimiter, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (Requires Bearer token)
 */
router.get('/me', requireAuth, getMe);

export default router;

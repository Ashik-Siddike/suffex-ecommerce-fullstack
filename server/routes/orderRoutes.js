import express from 'express';
import { createOrder, getOrders } from '../controllers/orderController.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';
import { orderLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create new order (Rate limited: 15 per hour)
 * @access  Public / Optional Auth
 */
router.post('/', orderLimiter, optionalAuth, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get order history (Authenticated: user's orders; Guest: query by phone + order_id)
 * @access  Public / Optional Auth
 */
router.get('/', optionalAuth, getOrders);

export default router;

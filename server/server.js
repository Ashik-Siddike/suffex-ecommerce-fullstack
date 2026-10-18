import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { pool } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers with Helmet
// Configure crossOriginResourcePolicy to 'cross-origin' so external assets (e.g. Unsplash CDN images) render properly
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing
app.use(cors());

// Strict Request Payload Size Limit (prevents large payload DoS attacks)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check Endpoint with Database Ping
app.get('/api/health', async (req, res) => {
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - startTime;

    res.status(200).json({
      status: 'ok',
      db: 'connected',
      uptime: process.uptime(),
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Health check database error:', err.message);
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      error: err.message,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
});

// Primary API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [Helmet, RateLimiting & HealthCheck Active]`);
});

import express from 'express';
import {
  getAdminStats,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminOrders,
  updateOrderStatus,
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Enforce authentication & administrator privileges on ALL /api/admin routes
router.use(requireAuth, requireAdmin);

// Dashboard KPI Analytics
router.get('/stats', getAdminStats);

// Products Administration (CRUD + JSONB Attributes)
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders Administration & Atomic Status Transitions
router.get('/orders', getAdminOrders);
router.patch('/orders/:id/status', updateOrderStatus);

// Coupons & Promotional Campaign Administration
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

export default router;

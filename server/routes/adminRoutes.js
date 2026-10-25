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
import { uploadProductImage } from '../middlewares/uploadMiddleware.js';

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

// Cloudinary Product Image Upload (multipart/form-data with 'image' field)
router.post('/upload', (req, res) => {
  uploadProductImage.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Image upload failed. Allowed formats: JPG, PNG, WEBP, AVIF (Max: 5MB).',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided in request. Form field name must be "image".',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product image uploaded to Cloudinary successfully.',
      url: req.file.path,
      secure_url: req.file.path,
      public_id: req.file.filename,
    });
  });
});

// Orders Administration & Atomic Status Transitions
router.get('/orders', getAdminOrders);
router.patch('/orders/:id/status', updateOrderStatus);

// Coupons & Promotional Campaign Administration
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

export default router;

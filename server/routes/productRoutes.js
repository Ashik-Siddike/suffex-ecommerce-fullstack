import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  getProductReviews,
  createProductReview,
} from '../controllers/productController.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Aliases for unified query engine
router.get('/search', getAllProducts);
router.get('/category/:category', (req, res, next) => {
  req.query.category = req.params.category;
  return getAllProducts(req, res, next);
});

// Reviews endpoints
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', optionalAuth, createProductReview);

// Core product endpoints
router.get('/', getAllProducts);
router.get('/:id', getProductById);

export default router;

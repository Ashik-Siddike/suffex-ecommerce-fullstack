import { Router } from 'express';
import { getCoupons, validateCoupon } from '../controllers/couponController.js';
import { validateCouponInput } from '../middlewares/validateRequest.js';

const router = Router();

router.get('/', getCoupons);
router.post('/validate', validateCouponInput, validateCoupon);

export default router;

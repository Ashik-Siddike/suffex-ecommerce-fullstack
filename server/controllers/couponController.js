import { pool } from '../config/db.js';

/**
 * GET /api/coupons
 * Returns public promotional coupons that are active and not expired
 */
export const getCoupons = async (req, res, next) => {
  try {
    const query = `
      SELECT id, code, discount_type, discount_value, min_order_amount, max_discount, badge, description, expiry_date 
      FROM public.coupons 
      WHERE is_active = true AND expiry_date >= CURRENT_DATE 
      ORDER BY id ASC
    `;
    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      coupons: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/coupons/validate
 * Real-time coupon validation against PostgreSQL database
 * Body: { code: string, subtotal: number }
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal = 0 } = req.body;
    const normalizedCode = String(code).trim().toUpperCase();
    const cartSubtotal = Math.max(0, Number(subtotal) || 0);

    const query = `
      SELECT * FROM public.coupons 
      WHERE UPPER(code) = $1 AND is_active = true
    `;
    const result = await pool.query(query, [normalizedCode]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        isValid: false,
        discount: 0,
        message: `Invalid coupon code "${normalizedCode}". Try "STORE20" or "SUFFEX500".`,
      });
    }

    const coupon = result.rows[0];

    // Expiry check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(coupon.expiry_date);
    if (expiry < today) {
      return res.status(200).json({
        isValid: false,
        discount: 0,
        message: `Coupon "${coupon.code}" has expired on ${expiry.toLocaleDateString()}.`,
      });
    }

    // Usage limit check
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(200).json({
        isValid: false,
        discount: 0,
        message: `Coupon "${coupon.code}" has reached its maximum usage limit.`,
      });
    }

    // Minimum order check
    const minOrder = Number(coupon.min_order_amount) || 0;
    if (cartSubtotal < minOrder) {
      return res.status(200).json({
        isValid: false,
        discount: 0,
        message: `Coupon "${coupon.code}" requires a minimum cart total of ৳${minOrder.toLocaleString()}.`,
      });
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      const rawDiscount = Math.round((cartSubtotal * Number(coupon.discount_value)) / 100);
      discount = coupon.max_discount
        ? Math.min(rawDiscount, Number(coupon.max_discount))
        : rawDiscount;
    } else if (coupon.discount_type === 'flat') {
      discount = Math.min(cartSubtotal, Number(coupon.discount_value));
    }

    return res.status(200).json({
      isValid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        max_discount: coupon.max_discount ? Number(coupon.max_discount) : null,
        min_order_amount: minOrder,
        badge: coupon.badge,
        description: coupon.description,
      },
      discount,
      message: `Coupon "${coupon.code}" applied! You saved ৳${discount.toLocaleString()}.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Input validation middleware for order creation
 */
export const validateOrderInput = (req, res, next) => {
  const { customer_name, customer_phone, delivery_address, items } = req.body;

  if (!customer_name || typeof customer_name !== 'string' || !customer_name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Customer name is required and must be valid text.',
    });
  }

  if (!customer_phone || typeof customer_phone !== 'string' || !customer_phone.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Customer phone number is required.',
    });
  }

  if (!delivery_address || typeof delivery_address !== 'string' || !delivery_address.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Delivery address is required.',
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Order must contain at least one item.',
    });
  }

  // Verify each item structure
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawId = item.id || item.product_id;
    if (rawId === undefined || rawId === null) {
      return res.status(400).json({
        success: false,
        error: `Item at index ${i} is missing an 'id' or 'product_id'.`,
      });
    }
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      // Default to 1 if not provided or 0
      item.quantity = 1;
    }
  }

  next();
};

/**
 * Input validation middleware for coupon validation
 */
export const validateCouponInput = (req, res, next) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({
      isValid: false,
      discount: 0,
      message: 'Please provide a valid coupon code.',
    });
  }

  next();
};

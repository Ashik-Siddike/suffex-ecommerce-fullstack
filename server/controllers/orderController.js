import { pool } from '../config/db.js';

/**
 * POST /api/orders
 * ACID Transaction: Deduct stock, validate & record coupon, insert order
 */
export const createOrder = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      district,
      payment_method = 'cod',
      items,
      coupon_code,
    } = req.body;

    // Start ACID Database Transaction
    await client.query('BEGIN');

    const verifiedItems = [];
    let calculatedSubtotal = 0;

    // 1. Loop through items with Row-Level Locking & Stock Verification
    for (const item of items) {
      const rawId = item.id || item.product_id;
      const cleanId = parseInt(String(rawId).replace(/^prod-/, ''), 10);
      const requestedQuantity = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (isNaN(cleanId)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Invalid product ID format provided: "${rawId}".`,
        });
      }

      // Lock row to prevent race conditions during concurrent orders
      const productQuery = `
        SELECT id, title, price, stock, thumbnail 
        FROM public.products 
        WHERE id = $1 
        FOR UPDATE
      `;
      const productResult = await client.query(productQuery, [cleanId]);

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: `Product with ID ${cleanId} was not found in our catalog.`,
        });
      }

      const product = productResult.rows[0];

      // Stock verification
      if (product.stock < requestedQuantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${product.title}". Requested: ${requestedQuantity}, Available: ${product.stock}.`,
        });
      }

      // Stock deduction
      await client.query(
        'UPDATE public.products SET stock = stock - $1 WHERE id = $2',
        [requestedQuantity, cleanId]
      );

      // Server-side price calculation (Database ground truth)
      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * requestedQuantity;
      calculatedSubtotal += lineTotal;

      verifiedItems.push({
        id: product.id,
        title: product.title,
        price: unitPrice,
        quantity: requestedQuantity,
        image: product.thumbnail || item.image || item.thumbnail || null,
        line_total: lineTotal,
      });
    }

    // 2. Server-side Coupon Validation & Calculation
    let verifiedDiscount = 0;
    let verifiedCouponCode = null;

    if (coupon_code && String(coupon_code).trim() !== '') {
      const normalizedCode = String(coupon_code).trim().toUpperCase();

      const couponQuery = `
        SELECT * FROM public.coupons 
        WHERE UPPER(code) = $1 AND is_active = true 
        FOR UPDATE
      `;
      const couponResult = await client.query(couponQuery, [normalizedCode]);

      if (couponResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Invalid or inactive coupon code: "${normalizedCode}".`,
        });
      }

      const coupon = couponResult.rows[0];

      // Verify expiration date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(coupon.expiry_date);
      if (expiry < today) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Coupon "${normalizedCode}" has expired.`,
        });
      }

      // Verify usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Coupon "${normalizedCode}" has reached its maximum global usage limit.`,
        });
      }

      // Verify minimum order amount requirement
      const minOrder = Number(coupon.min_order_amount) || 0;
      if (calculatedSubtotal < minOrder) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Coupon "${normalizedCode}" requires a minimum order of ৳${minOrder.toLocaleString()}. (Current subtotal: ৳${calculatedSubtotal.toLocaleString()})`,
        });
      }

      // Calculate discount amount securely
      if (coupon.discount_type === 'percentage') {
        const rawDiscount = Math.round((calculatedSubtotal * Number(coupon.discount_value)) / 100);
        verifiedDiscount = coupon.max_discount
          ? Math.min(rawDiscount, Number(coupon.max_discount))
          : rawDiscount;
      } else if (coupon.discount_type === 'flat') {
        verifiedDiscount = Math.min(calculatedSubtotal, Number(coupon.discount_value));
      }

      verifiedCouponCode = coupon.code;

      // Increment coupon usage counter
      await client.query(
        'UPDATE public.coupons SET used_count = used_count + 1 WHERE id = $1',
        [coupon.id]
      );
    }

    // 3. Delivery Charge Calculation (Matching frontend logic)
    // Orders of ৳2,500 or more qualify for FREE Delivery
    // Below ৳2,500: Inside Dhaka = 60 BDT, Outside Dhaka = 120 BDT
    let deliveryCharge = 0;
    if (calculatedSubtotal < 2500) {
      const isDhaka = district && String(district).trim().toLowerCase().includes('dhaka');
      deliveryCharge = isDhaka ? 60 : 120;
    }

    // 4. Compute Final Grand Total
    const finalTotalAmount = Math.max(0, calculatedSubtotal - verifiedDiscount + deliveryCharge);

    // 5. User link if authenticated
    const userId = req.user?.id || null;

    // 6. Insert Order with JSONB Snapshot and optional user_id
    const insertOrderQuery = `
      INSERT INTO public.orders (
        customer_name,
        customer_phone,
        customer_email,
        delivery_address,
        district,
        payment_method,
        items,
        total_amount,
        coupon_code,
        coupon_discount,
        status,
        user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12)
      RETURNING *;
    `;

    const insertOrderValues = [
      customer_name.trim(),
      customer_phone.trim(),
      customer_email ? customer_email.trim() : null,
      delivery_address.trim(),
      district ? district.trim() : null,
      payment_method,
      JSON.stringify(verifiedItems),
      finalTotalAmount,
      verifiedCouponCode,
      verifiedDiscount,
      'Pending',
      userId,
    ];

    const orderResult = await client.query(insertOrderQuery, insertOrderValues);

    // COMMIT the entire ACID Transaction
    await client.query('COMMIT');

    const createdOrder = orderResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Order verified and placed successfully!',
      order: createdOrder,
      financialSummary: {
        subtotal: calculatedSubtotal,
        discount: verifiedDiscount,
        deliveryCharge,
        totalAmount: finalTotalAmount,
      },
    });
  } catch (error) {
    // Immediate rollback on any failure
    await client.query('ROLLBACK');
    next(error);
  } finally {
    // Always release client back to pool
    client.release();
  }
};

/**
 * GET /api/orders
 * Retrieve customer orders securely:
 * - Authenticated users (Bearer JWT): Retrieves their full order history.
 * - Guest users: Requires BOTH `order_id` AND contact credentials (`phone` or `email`) to track a specific order.
 * - Unauthorized / scraping requests: Blocked with 401 Unauthorized or 400 Bad Request.
 */
export const getOrders = async (req, res, next) => {
  try {
    const { order_id, id, phone, email } = req.query;
    const targetOrderId = order_id || id;

    // SCENARIO 1: Authenticated User (via JWT token)
    if (req.user) {
      let queryText = `
        SELECT * FROM public.orders 
        WHERE user_id = $1 
           OR LOWER(customer_email) = LOWER($2) 
           OR ($3::varchar IS NOT NULL AND customer_phone = $3)
      `;
      const values = [req.user.id, req.user.email, req.user.phone || null];

      // If authenticated user also filters by specific order ID
      if (targetOrderId) {
        const cleanOrderId = parseInt(String(targetOrderId).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(cleanOrderId)) {
          values.push(cleanOrderId);
          queryText += ` AND id = $${values.length}`;
        }
      }

      queryText += ' ORDER BY created_at DESC';

      const result = await pool.query(queryText, values);

      const formattedOrders = result.rows.map((order) => ({
        ...order,
        total_amount: Number(order.total_amount) || 0,
        coupon_discount: Number(order.coupon_discount) || 0,
      }));

      return res.status(200).json({
        success: true,
        authenticated: true,
        orders: formattedOrders,
        total: formattedOrders.length,
      });
    }

    // SCENARIO 2: Unauthenticated / Guest User
    // Privacy Protection: Prevent bulk scraping of orders and customer home addresses
    if (!targetOrderId) {
      return res.status(401).json({
        success: false,
        error:
          'Unauthorized: Please log in to view your complete order history, or provide both Order ID and Phone Number for guest order tracking.',
      });
    }

    const cleanPhone = phone ? phone.trim() : null;
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({
        success: false,
        error:
          'Both Order ID and contact Phone Number (or Email) are required for guest order tracking.',
      });
    }

    const cleanOrderId = parseInt(String(targetOrderId).replace(/[^0-9]/g, ''), 10);
    if (isNaN(cleanOrderId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid Order ID format: "${targetOrderId}".`,
      });
    }

    // Query specific order matching order ID and phone/email
    const queryText = `
      SELECT * FROM public.orders 
      WHERE id = $1 AND (
        ($2::varchar IS NOT NULL AND customer_phone = $2)
        OR ($3::varchar IS NOT NULL AND LOWER(customer_email) = $3)
      )
    `;

    const result = await pool.query(queryText, [cleanOrderId, cleanPhone, cleanEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No matching order found for the provided Order ID and contact credentials.',
      });
    }

    const formattedOrders = result.rows.map((order) => ({
      ...order,
      total_amount: Number(order.total_amount) || 0,
      coupon_discount: Number(order.coupon_discount) || 0,
    }));

    return res.status(200).json({
      success: true,
      guestTracking: true,
      orders: formattedOrders,
      total: formattedOrders.length,
    });
  } catch (error) {
    next(error);
  }
};

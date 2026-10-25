import { pool } from '../config/db.js';

/**
 * GET /api/admin/stats
 * Return overall KPI statistics for the admin dashboard:
 * - Total revenue (sum of non-cancelled orders)
 * - Total orders count
 * - Total products count
 * - Low-stock alerts (stock <= 5)
 * - Recent 5 orders with items and customer info
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const [revenueRes, ordersCountRes, productsCountRes, lowStockRes, recentOrdersRes] =
      await Promise.all([
        // Revenue from confirmed / non-cancelled orders
        pool.query(
          "SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM public.orders WHERE status != 'Cancelled';"
        ),
        // Total orders count
        pool.query("SELECT COUNT(*) AS total_orders FROM public.orders;"),
        // Total active products count
        pool.query("SELECT COUNT(*) AS total_products FROM public.products WHERE is_active = true;"),
        // Low stock products (stock <= 5)
        pool.query(
          "SELECT id, title, price, stock, category, thumbnail FROM public.products WHERE stock <= 5 AND is_active = true ORDER BY stock ASC;"
        ),
        // 5 Most recent orders
        pool.query(
          "SELECT id, customer_name, customer_phone, customer_email, total_amount, status, created_at, items FROM public.orders ORDER BY created_at DESC LIMIT 5;"
        ),
      ]);

    const totalRevenue = Number(revenueRes.rows[0]?.total_revenue || 0);
    const totalOrders = parseInt(ordersCountRes.rows[0]?.total_orders || 0, 10);
    const totalProducts = parseInt(productsCountRes.rows[0]?.total_products || 0, 10);
    const lowStockProducts = lowStockRes.rows.map((p) => ({
      ...p,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
    }));
    const recentOrders = recentOrdersRes.rows.map((o) => ({
      ...o,
      total_amount: Number(o.total_amount) || 0,
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/products
 * Fetch all products (including attributes and active status) for admin management
 */
export const getAdminProducts = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, price, category, thumbnail, stock, attributes, is_active, created_at FROM public.products ORDER BY id DESC;"
    );

    const formattedProducts = result.rows.map((p) => ({
      ...p,
      thumbnail: p.thumbnail || '',
      image_url: p.thumbnail || '',
      image: p.thumbnail || '',
      images: p.thumbnail ? [p.thumbnail] : [],
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      attributes: p.attributes || {},
    }));

    res.status(200).json({
      success: true,
      products: formattedProducts,
      total: formattedProducts.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/products
 * Create a new product with dynamic JSONB attributes
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description = '',
      price,
      category = 'General',
      thumbnail = '',
      image_url = '',
      image = '',
      stock = 0,
      attributes = {},
    } = req.body;

    const resolvedThumbnail = (image_url || thumbnail || image || '').trim();

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Product title is required.',
      });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'A valid non-negative product price is required.',
      });
    }

    const numStock = Math.max(0, parseInt(stock, 10) || 0);

    let parsedAttributes = attributes;
    if (typeof attributes === 'string') {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch (e) {
        parsedAttributes = {};
      }
    }

    const insertQuery = `
      INSERT INTO public.products (
        title, description, price, category, thumbnail, stock, attributes, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, true)
      RETURNING *;
    `;

    const values = [
      title.trim(),
      description ? description.trim() : '',
      numPrice,
      category.trim(),
      resolvedThumbnail,
      numStock,
      JSON.stringify(parsedAttributes),
    ];

    const result = await pool.query(insertQuery, values);
    const created = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      product: {
        ...created,
        thumbnail: created.thumbnail || '',
        image_url: created.thumbnail || '',
        image: created.thumbnail || '',
        images: created.thumbnail ? [created.thumbnail] : [],
        price: Number(created.price) || 0,
        stock: Number(created.stock) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/products/:id
 * Update an existing product
 */
export const updateProduct = async (req, res, next) => {
  try {
    const cleanId = parseInt(req.params.id, 10);
    if (isNaN(cleanId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID.',
      });
    }

    const {
      title,
      description,
      price,
      category,
      thumbnail,
      image_url,
      image,
      stock,
      attributes,
      is_active,
    } = req.body;

    // Check if product exists
    const checkRes = await pool.query('SELECT * FROM public.products WHERE id = $1', [cleanId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Product with ID ${cleanId} not found.`,
      });
    }

    const current = checkRes.rows[0];

    const updatedTitle = title !== undefined ? title.trim() : current.title;
    const updatedDesc = description !== undefined ? description : current.description;
    const updatedPrice = price !== undefined ? Number(price) : Number(current.price);
    const updatedCat = category !== undefined ? category.trim() : current.category;
    const incomingImage = image_url !== undefined ? image_url : (thumbnail !== undefined ? thumbnail : image);
    const updatedThumb = incomingImage !== undefined ? String(incomingImage).trim() : current.thumbnail;
    const updatedStock = stock !== undefined ? Math.max(0, parseInt(stock, 10) || 0) : current.stock;
    const updatedIsActive = is_active !== undefined ? Boolean(is_active) : current.is_active;

    let updatedAttrs = current.attributes || {};
    if (attributes !== undefined) {
      if (typeof attributes === 'string') {
        try {
          updatedAttrs = JSON.parse(attributes);
        } catch (e) {
          updatedAttrs = current.attributes || {};
        }
      } else {
        updatedAttrs = attributes;
      }
    }

    const updateQuery = `
      UPDATE public.products
      SET title = $1,
          description = $2,
          price = $3,
          category = $4,
          thumbnail = $5,
          stock = $6,
          attributes = $7::jsonb,
          is_active = $8
      WHERE id = $9
      RETURNING *;
    `;

    const values = [
      updatedTitle,
      updatedDesc,
      updatedPrice,
      updatedCat,
      updatedThumb,
      updatedStock,
      JSON.stringify(updatedAttrs),
      updatedIsActive,
      cleanId,
    ];

    const result = await pool.query(updateQuery, values);
    const updated = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      product: {
        ...updated,
        thumbnail: updated.thumbnail || '',
        image_url: updated.thumbnail || '',
        image: updated.thumbnail || '',
        images: updated.thumbnail ? [updated.thumbnail] : [],
        price: Number(updated.price) || 0,
        stock: Number(updated.stock) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/products/:id
 * Delete product or perform soft-delete if referenced in order history
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const cleanId = parseInt(req.params.id, 10);
    if (isNaN(cleanId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID.',
      });
    }

    // Check if referenced in any orders items jsonb
    const orderRefCheck = await pool.query(
      `SELECT id FROM public.orders 
       WHERE items::text ILIKE $1 OR items::text ILIKE $2 
       LIMIT 1;`,
      [`%"id":${cleanId}%`, `%"id":"prod-${cleanId}"%`]
    );

    if (orderRefCheck.rows.length > 0) {
      // Soft-delete to preserve foreign order integrity
      await pool.query(
        'UPDATE public.products SET is_active = false WHERE id = $1',
        [cleanId]
      );

      return res.status(200).json({
        success: true,
        message: 'Product is linked to customer orders; archived (soft-deleted) successfully.',
        softDeleted: true,
      });
    }

    // Permanent delete if unreferenced
    const delResult = await pool.query(
      'DELETE FROM public.products WHERE id = $1 RETURNING id;',
      [cleanId]
    );

    if (delResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Product with ID ${cleanId} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product permanently removed from database.',
      softDeleted: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders
 * Fetch all orders with optional ?status= filter
 */
export const getAdminOrders = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = 'SELECT * FROM public.orders';
    const values = [];

    if (status && status !== 'all' && status.trim() !== '') {
      values.push(status.trim().toLowerCase());
      query += ' WHERE LOWER(status) = $1';
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);

    const formattedOrders = result.rows.map((o) => ({
      ...o,
      total_amount: Number(o.total_amount) || 0,
      coupon_discount: Number(o.coupon_discount) || 0,
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders,
      total: formattedOrders.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/orders/:id/status
 * Atomic status transition with automated inventory stock restoration upon cancellation
 */
export const updateOrderStatus = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const cleanId = parseInt(req.params.id, 10);
    if (isNaN(cleanId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID.',
      });
    }

    const { status } = req.body;
    const allowedStatuses = [
      'Pending',
      'Confirmed',
      'Processing',
      'Shipped',
      'Delivered',
      'Cancelled',
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
      });
    }

    // Begin ACID transaction with row-level lock
    await client.query('BEGIN');

    const orderRes = await client.query(
      'SELECT * FROM public.orders WHERE id = $1 FOR UPDATE;',
      [cleanId]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: `Order #${cleanId} not found.`,
      });
    }

    const order = orderRes.rows[0];
    const prevStatus = order.status;

    // CRITICAL LOGIC: If status changes TO 'Cancelled' from another status, restore inventory stock
    if (status === 'Cancelled' && prevStatus !== 'Cancelled') {
      let items = [];
      if (Array.isArray(order.items)) {
        items = order.items;
      } else if (typeof order.items === 'string') {
        try {
          items = JSON.parse(order.items);
        } catch (e) {
          items = [];
        }
      }

      for (const item of items) {
        const rawId = item.id || item.product_id;
        const prodId = parseInt(String(rawId).replace(/^prod-/, ''), 10);
        const qtyToRestore = Math.max(1, parseInt(item.quantity, 10) || 1);

        if (!isNaN(prodId)) {
          await client.query(
            'UPDATE public.products SET stock = stock + $1 WHERE id = $2;',
            [qtyToRestore, prodId]
          );
        }
      }
    }

    // Update status in orders table
    const updateRes = await client.query(
      'UPDATE public.orders SET status = $1 WHERE id = $2 RETURNING *;',
      [status, cleanId]
    );

    await client.query('COMMIT');

    const updatedOrder = updateRes.rows[0];

    res.status(200).json({
      success: true,
      message: `Order #${cleanId} status transitioned from "${prevStatus}" to "${status}".`,
      order: {
        ...updatedOrder,
        total_amount: Number(updatedOrder.total_amount) || 0,
        coupon_discount: Number(updatedOrder.coupon_discount) || 0,
      },
      previousStatus: prevStatus,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * GET /api/admin/coupons
 * Retrieve all coupons for administrative management
 */
export const getAdminCoupons = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM public.coupons ORDER BY id DESC;');

    const formatted = result.rows.map((c) => ({
      ...c,
      discount_value: Number(c.discount_value) || 0,
      min_order_amount: Number(c.min_order_amount) || 0,
      max_discount: c.max_discount !== null ? Number(c.max_discount) : null,
      usage_limit: c.usage_limit !== null ? Number(c.usage_limit) : null,
      used_count: Number(c.used_count) || 0,
    }));

    res.status(200).json({
      success: true,
      coupons: formatted,
      total: formatted.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/coupons
 * Create a new promotional discount coupon
 */
export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      min_order_amount = 0,
      max_discount,
      usage_limit = 1000,
      expiry_date,
      badge = 'PROMO',
      description = '',
    } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required.',
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    if (!['percentage', 'flat'].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        error: 'Discount type must be either "percentage" or "flat".',
      });
    }

    const numValue = Number(discount_value);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Discount value must be a positive number.',
      });
    }

    if (!expiry_date) {
      return res.status(400).json({
        success: false,
        error: 'Expiry date is required.',
      });
    }

    // Check duplicate code
    const dupCheck = await pool.query('SELECT id FROM public.coupons WHERE UPPER(code) = $1', [normalizedCode]);
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Coupon code "${normalizedCode}" already exists.`,
      });
    }

    const insertQuery = `
      INSERT INTO public.coupons (
        code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, used_count, badge, description, expiry_date, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, true)
      RETURNING *;
    `;

    const values = [
      normalizedCode,
      discount_type,
      numValue,
      Number(min_order_amount) || 0,
      max_discount !== undefined && max_discount !== null ? Number(max_discount) : null,
      usage_limit ? parseInt(usage_limit, 10) : 1000,
      badge ? badge.trim() : 'PROMO',
      description ? description.trim() : '',
      expiry_date,
    ];

    const result = await pool.query(insertQuery, values);
    const created = result.rows[0];

    res.status(201).json({
      success: true,
      message: `Coupon "${normalizedCode}" created successfully!`,
      coupon: {
        ...created,
        discount_value: Number(created.discount_value) || 0,
        min_order_amount: Number(created.min_order_amount) || 0,
        max_discount: created.max_discount !== null ? Number(created.max_discount) : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/coupons/:id
 * Toggle coupon status or edit coupon parameters
 */
export const updateCoupon = async (req, res, next) => {
  try {
    const cleanId = parseInt(req.params.id, 10);
    if (isNaN(cleanId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coupon ID.',
      });
    }

    const {
      is_active,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount,
      usage_limit,
      expiry_date,
      badge,
      description,
    } = req.body;

    const check = await pool.query('SELECT * FROM public.coupons WHERE id = $1', [cleanId]);
    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Coupon with ID ${cleanId} not found.`,
      });
    }

    const current = check.rows[0];

    const updateQuery = `
      UPDATE public.coupons
      SET is_active = COALESCE($1, is_active),
          discount_type = COALESCE($2, discount_type),
          discount_value = COALESCE($3, discount_value),
          min_order_amount = COALESCE($4, min_order_amount),
          max_discount = COALESCE($5, max_discount),
          usage_limit = COALESCE($6, usage_limit),
          expiry_date = COALESCE($7, expiry_date),
          badge = COALESCE($8, badge),
          description = COALESCE($9, description)
      WHERE id = $10
      RETURNING *;
    `;

    const values = [
      is_active !== undefined ? Boolean(is_active) : null,
      discount_type || null,
      discount_value !== undefined ? Number(discount_value) : null,
      min_order_amount !== undefined ? Number(min_order_amount) : null,
      max_discount !== undefined ? (max_discount === null ? null : Number(max_discount)) : null,
      usage_limit !== undefined ? (usage_limit === null ? null : parseInt(usage_limit, 10)) : null,
      expiry_date || null,
      badge || null,
      description || null,
      cleanId,
    ];

    const result = await pool.query(updateQuery, values);
    const updated = result.rows[0];

    res.status(200).json({
      success: true,
      message: `Coupon "${updated.code}" updated successfully.`,
      coupon: {
        ...updated,
        discount_value: Number(updated.discount_value) || 0,
        min_order_amount: Number(updated.min_order_amount) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/coupons/:id
 * Delete coupon
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const cleanId = parseInt(req.params.id, 10);
    if (isNaN(cleanId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coupon ID.',
      });
    }

    const del = await pool.query('DELETE FROM public.coupons WHERE id = $1 RETURNING code;', [cleanId]);
    if (del.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Coupon with ID ${cleanId} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Coupon "${del.rows[0].code}" deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

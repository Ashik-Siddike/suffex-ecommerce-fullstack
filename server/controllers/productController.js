import { pool } from '../config/db.js';

/**
 * GET /api/products
 * High-Performance Product Query Engine supporting:
 * - Search: (?q=)
 * - Category Filter: (?category=)
 * - SQL-level Sorting: (?sort=price_asc | price_desc | newest)
 * - Pagination: (?page=1&limit=12)
 * Returns: { data, total, page, totalPages, ... }
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const {
      q,
      category,
      sort,
      sortBy,
      order,
      page = 1,
      limit = 12,
      skip,
    } = req.query;

    let baseQuery = `
      SELECT 
        id, 
        title, 
        description, 
        price, 
        category, 
        thumbnail, 
        stock, 
        attributes, 
        is_active,
        created_at 
      FROM public.products
    `;

    const conditions = [];
    const values = [];

    // Filter out inactive products for public storefront
    conditions.push('(is_active IS NULL OR is_active = true)');

    // 1. Search filter: Matches title or description (Case-Insensitive ILIKE)
    if (q && q.trim() !== '') {
      values.push(`%${q.trim()}%`);
      conditions.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length})`);
    }

    // 2. Category filter: Exclude 'all' or empty strings
    if (category && category.trim() !== '' && category.trim().toLowerCase() !== 'all') {
      values.push(category.trim().toLowerCase());
      conditions.push(`LOWER(category) = $${values.length}`);
    }

    // Append WHERE clause
    baseQuery += ' WHERE ' + conditions.join(' AND ');

    // Capture count query parameters matching the exact WHERE conditions
    const countValues = [...values];
    let countQuery = 'SELECT COUNT(*) FROM public.products WHERE ' + conditions.join(' AND ');

    // 3. SQL-level Sorting Logic
    let orderClause = 'ORDER BY id ASC';

    if (sort) {
      const normalizedSort = sort.trim().toLowerCase();
      switch (normalizedSort) {
        case 'price_asc':
          orderClause = 'ORDER BY price ASC, id ASC';
          break;
        case 'price_desc':
          orderClause = 'ORDER BY price DESC, id DESC';
          break;
        case 'newest':
          orderClause = 'ORDER BY created_at DESC, id DESC';
          break;
        case 'oldest':
          orderClause = 'ORDER BY created_at ASC, id ASC';
          break;
        case 'title_asc':
          orderClause = 'ORDER BY title ASC, id ASC';
          break;
        case 'title_desc':
          orderClause = 'ORDER BY title DESC, id ASC';
          break;
        default:
          orderClause = 'ORDER BY id ASC';
      }
    } else if (sortBy) {
      const allowedSortColumns = ['id', 'title', 'price', 'stock', 'created_at'];
      const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'id';
      const safeOrder = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY ${safeSortBy} ${safeOrder}`;
    }

    baseQuery += ' ' + orderClause;

    // 4. Pagination
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const offset = skip !== undefined ? Math.max(0, parseInt(skip, 10) || 0) : (parsedPage - 1) * parsedLimit;

    values.push(parsedLimit);
    baseQuery += ` LIMIT $${values.length}`;

    values.push(offset);
    baseQuery += ` OFFSET $${values.length}`;

    // Execute queries in parallel
    const [result, countResult] = await Promise.all([
      pool.query(baseQuery, values),
      pool.query(countQuery, countValues),
    ]);

    const totalCount = parseInt(countResult.rows[0]?.count || 0, 10);
    const totalPages = Math.ceil(totalCount / parsedLimit) || 1;

    const formattedProducts = result.rows.map((p) => ({
      ...p,
      price: Number(p.price) || 0,
      stock: p.stock !== undefined ? Number(p.stock) : 99,
    }));

    res.status(200).json({
      success: true,
      data: formattedProducts,
      products: formattedProducts,
      total: totalCount,
      page: parsedPage,
      totalPages,
      limit: parsedLimit,
      skip: offset,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 * Fetch single product details by dynamic ID
 */
export const getProductById = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const cleanId = parseInt(String(rawId).replace(/^prod-/, ''), 10);

    if (isNaN(cleanId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid product ID format: "${rawId}".`,
      });
    }

    const result = await pool.query(
      `SELECT id, title, description, price, category, thumbnail, stock, attributes, is_active, created_at 
       FROM public.products 
       WHERE id = $1`,
      [cleanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Product with ID ${cleanId} not found.`,
      });
    }

    const p = result.rows[0];
    const formattedProduct = {
      ...p,
      price: Number(p.price) || 0,
      stock: p.stock !== undefined ? Number(p.stock) : 0,
    };

    res.status(200).json({
      success: true,
      product: formattedProduct,
      data: formattedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id/reviews
 * Return all reviews for a specific product with rating analytics & breakdown
 */
export const getProductReviews = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const cleanId = parseInt(String(rawId).replace(/^prod-/, ''), 10);

    if (isNaN(cleanId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid product ID format: "${rawId}".`,
      });
    }

    // Query all reviews for this product
    const reviewResult = await pool.query(
      `SELECT id, product_id, user_id, customer_name, rating, comment, is_verified_purchase, created_at 
       FROM public.reviews 
       WHERE product_id = $1 
       ORDER BY created_at DESC;`,
      [cleanId]
    );

    const reviews = reviewResult.rows;
    const totalReviews = reviews.length;

    // Calculate average rating & breakdown
    let totalScore = 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((r) => {
      totalScore += r.rating;
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating]++;
      }
    });

    const averageRating = totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      reviews,
      totalReviews,
      averageRating,
      ratingBreakdown: breakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products/:id/reviews
 * Submit a customer review with automated Verified Purchase detection
 */
export const createProductReview = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const cleanId = parseInt(String(rawId).replace(/^prod-/, ''), 10);

    if (isNaN(cleanId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid product ID format: "${rawId}".`,
      });
    }

    // Verify product exists
    const prodCheck = await pool.query('SELECT id, title FROM public.products WHERE id = $1', [cleanId]);
    if (prodCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Product with ID ${cleanId} not found.`,
      });
    }

    const { customer_name, rating, comment, email, phone } = req.body;

    // Validate rating
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be an integer between 1 and 5.',
      });
    }

    // Validate customer name (if authenticated user, fallback to user's name)
    const effectiveName = (req.user?.name || customer_name || '').trim();
    if (!effectiveName) {
      return res.status(400).json({
        success: false,
        error: 'Your name is required to submit a review.',
      });
    }

    const effectiveEmail = (req.user?.email || email || '').trim().toLowerCase() || null;
    const effectivePhone = (req.user?.phone || phone || '').trim() || null;
    const effectiveUserId = req.user?.id || null;

    // Automated Verified Purchase Check:
    let isVerifiedPurchase = false;

    if (effectiveEmail || effectivePhone || effectiveUserId) {
      const orderCheckQuery = `
        SELECT id FROM public.orders 
        WHERE status != 'Cancelled'
          AND (
            ($1::varchar IS NOT NULL AND LOWER(customer_email) = LOWER($1))
            OR ($2::varchar IS NOT NULL AND customer_phone = $2)
            OR ($3::integer IS NOT NULL AND user_id = $3)
          )
          AND EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(items) AS item
            WHERE (item->>'id')::text = $4::text 
               OR (item->>'product_id')::text = $4::text
          )
        LIMIT 1;
      `;

      const orderCheck = await pool.query(orderCheckQuery, [
        effectiveEmail,
        effectivePhone,
        effectiveUserId,
        cleanId,
      ]);

      if (orderCheck.rows.length > 0) {
        isVerifiedPurchase = true;
      }
    }

    // Insert Review
    const insertQuery = `
      INSERT INTO public.reviews (
        product_id,
        user_id,
        customer_name,
        rating,
        comment,
        is_verified_purchase,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [
      cleanId,
      effectiveUserId,
      effectiveName,
      numRating,
      comment ? comment.trim() : '',
      isVerifiedPurchase,
    ]);

    const createdReview = result.rows[0];

    res.status(201).json({
      success: true,
      message: isVerifiedPurchase
        ? 'Thank you! Your verified purchase review has been published.'
        : 'Thank you! Your review has been submitted successfully.',
      review: createdReview,
      is_verified_purchase: isVerifiedPurchase,
    });
  } catch (error) {
    next(error);
  }
};

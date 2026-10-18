/**
 * Centralized error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  // Handle PostgreSQL specific error codes
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'A record with this unique information already exists.',
      detail: err.detail,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Foreign key reference violation.',
      detail: err.detail,
    });
  }

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * 404 Route Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

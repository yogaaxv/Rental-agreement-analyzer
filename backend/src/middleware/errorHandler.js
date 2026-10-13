import multer from 'multer';
import { ZodError } from 'zod';

/**
 * Global Express error handler middleware.
 * Handles Multer errors, Zod validation errors, and generic errors.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function errorHandler(err, req, res, next) {
  // Already sent — delegate to Express default
  if (res.headersSent) {
    return next(err);
  }

  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Multer-specific errors (file size, unexpected field, etc.)
  if (err instanceof multer.MulterError) {
    let message = err.message;
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = process.env.MAX_FILE_SIZE_MB || '10';
      message = `File is too large. Maximum allowed size is ${maxMb} MB.`;
    }
    return res.status(400).json({ error: message, code: err.code });
  }

  // File type rejection (from fileFilter)
  if (err.status === 400 && err.message) {
    return res.status(400).json({ error: err.message });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Generic errors
  const statusCode = err.status || err.statusCode || 500;
  const message = isDevelopment
    ? err.message || 'Internal server error'
    : statusCode < 500
      ? err.message
      : 'Internal server error';

  if (isDevelopment && statusCode >= 500) {
    console.error('[errorHandler]', err);
  }

  return res.status(statusCode).json({ error: message });
}

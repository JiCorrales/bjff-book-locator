/**
 * Error handling middleware for Express
 * Provides consistent error responses and logging
 */

import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error details
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};

/**
 * Create a custom API error
 */
export const createApiError = (
  message: string,
  statusCode: number = 500,
  code?: string
): ApiError => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

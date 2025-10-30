/**
 * Book Controller
 * Handles HTTP requests for book-related operations
 */

import { Request, Response, NextFunction } from 'express';
import * as bookService from '../services/bookService';

/**
 * POST /api/books/search
 * Search for a book by classification code
 *
 * Body: { code: string }
 * Response: SearchBookResult
 */
export const searchBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CODE',
          message: 'Classification code is required in request body'
        }
      });
    }

    const result = await bookService.searchBook(code);

    // If book not found, return 404
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/search?code=XXX
 * Alternative search endpoint using query parameters
 *
 * Query: code=string
 * Response: SearchBookResult
 */
export const searchBookQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CODE',
          message: 'Classification code is required as query parameter'
        }
      });
    }

    const result = await bookService.searchBook(code);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/stats
 * Get library collection statistics
 *
 * Response: { total_modules, total_parts, total_units, total_shelves, shelves_with_images }
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await bookService.getLibraryStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Book Routes
 * Defines API endpoints for book operations
 */

import { Router } from 'express';
import * as bookController from '../controllers/bookController';

const router = Router();

/**
 * POST /api/books/search
 * Search for a book by classification code (body parameter)
 *
 * Body:
 * {
 *   "code": "510.2 A100a"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "code": "510.2 A100a",
 *   "comparable_key": "DAA510200000A100000000",
 *   "location": {
 *     "shelf_id": 12,
 *     "shelf_range_start": "510.0 A000a",
 *     "shelf_range_end": "510.5 Z999z",
 *     "shelf_image_path": "output_final/module1/front/s3_r2.jpg",
 *     "module_number": 1,
 *     "module_name": "Mathematics",
 *     "part_name": "front",
 *     "unit_name": "C",
 *     "unit_number": 3,
 *     "shelf_number": 2,
 *     "location_text": "Module 1 - front - Unit C - Shelf 2"
 *   }
 * }
 */
router.post('/search', bookController.searchBook);

/**
 * GET /api/books/search?code=XXX
 * Search for a book by classification code (query parameter)
 *
 * Query Parameters:
 * - code: Classification code (e.g., "510.2 A100a")
 *
 * Response: Same as POST /search
 */
router.get('/search', bookController.searchBookQuery);

/**
 * GET /api/books/stats
 * Get library collection statistics
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "total_modules": 2,
 *     "total_parts": 4,
 *     "total_units": 32,
 *     "total_shelves": 160,
 *     "shelves_with_images": 160
 *   }
 * }
 */
router.get('/stats', bookController.getStats);

export default router;
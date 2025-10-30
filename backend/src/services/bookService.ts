/**
 * Book Service
 * Business logic for book location operations
 * Orchestrates parser + database queries
 */

import { parseClassificationCode } from '../utils/classificationParser/parser';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';
import { createApiError } from '../middleware/errorHandler';

export interface BookLocation {
  shelf_id: number;
  shelf_range_start: string;
  shelf_range_end: string;
  shelf_image_path: string | null;
  module_number: number;
  module_name: string;
  part_name: string;
  unit_name: string;
  unit_number: number;
  shelf_number: number;
  location_text: string;
}

export interface SearchBookResult {
  success: boolean;
  code: string;
  comparable_key: string;
  location?: BookLocation;
  message?: string;
}

/**
 * Search for a book by its classification code
 */
export async function searchBook(code: string): Promise<SearchBookResult> {
  // Validate input
  if (!code || typeof code !== 'string') {
    throw createApiError('Classification code is required', 400, 'INVALID_INPUT');
  }

  const trimmedCode = code.trim();
  if (trimmedCode.length === 0) {
    throw createApiError('Classification code cannot be empty', 400, 'INVALID_INPUT');
  }

  try {
    // Parse the classification code
    const parsed = parseClassificationCode(trimmedCode);

    console.log('=== DEBUG SQL ===');
    console.log('Code:', trimmedCode);
    console.log('Comparable Key:', parsed.comparableKey);
    console.log('Key type:', typeof parsed.comparableKey);
    console.log('Key length:', parsed.comparableKey.length);

    // Search in database using the comparable key
    const sqlQuery = `SELECT
        s.shelf_id,
        s.range_start AS shelf_range_start,
        s.range_end AS shelf_range_end,
        s.image_path AS shelf_image_path,
        s.shelf_number,
        m.module_number,
        m.module_name,
        mp.part_name,
        su.unit_name,
        su.unit_number,
        CONCAT(
          'Module ', COALESCE(CAST(m.module_number AS CHAR), 'N/A'),
          ' - ', COALESCE(mp.part_name, 'N/A'),
          ' - Unit ', COALESCE(su.unit_name, CAST(su.unit_number AS CHAR)),
          ' - Shelf ', COALESCE(CAST(s.shelf_number AS CHAR), 'N/A')
        ) AS location_text
      FROM Shelves s
      INNER JOIN Shelving_units su ON s.shelving_unit_id = su.shelving_unit_id
      INNER JOIN Module_parts mp ON su.module_part_id = mp.module_part_id
      INNER JOIN Modules m ON mp.module_id = m.module_id
      WHERE s.key_start <= ?
        AND s.key_end >= ?
        AND s.is_deleted = 0
        AND s.is_active = 1
      LIMIT 1`;

    const sqlParams = [parsed.comparableKey, parsed.comparableKey];
    console.log('SQL Query:', sqlQuery);
    console.log('SQL Params:', sqlParams);

    const [rows] = await pool.query<RowDataPacket[]>(sqlQuery, sqlParams);

    if (rows.length === 0) {
      return {
        success: false,
        code: trimmedCode,
        comparable_key: parsed.comparableKey,
        message: 'Book not found in any shelf. The classification code may be outside the library\'s collection range.'
      };
    }

    const location = rows[0] as BookLocation;

    return {
      success: true,
      code: trimmedCode,
      comparable_key: parsed.comparableKey,
      location
    };

  } catch (error: any) {
    // Log the actual error for debugging
    console.error('Error in searchBook:', error);

    // If it's already an API error, rethrow it
    if (error.statusCode) {
      throw error;
    }

    // Handle parsing errors
    if (error.message && error.message.includes('Invalid')) {
      throw createApiError(
        `Invalid classification code format: ${error.message}`,
        400,
        'INVALID_CODE_FORMAT'
      );
    }

    // Handle database errors with more detail
    throw createApiError(
      `Database error while searching for book: ${error.message || error.code || 'Unknown error'}`,
      500,
      'DATABASE_ERROR'
    );
  }
}

/**
 * Get statistics about the library collection
 */
export async function getLibraryStats() {
  try {
    const [stats] = await pool.query<RowDataPacket[]>(
      `SELECT
        COUNT(DISTINCT m.module_id) as total_modules,
        COUNT(DISTINCT mp.module_part_id) as total_parts,
        COUNT(DISTINCT su.shelving_unit_id) as total_units,
        COUNT(DISTINCT s.shelf_id) as total_shelves,
        COUNT(CASE WHEN s.image_path IS NOT NULL THEN 1 END) as shelves_with_images
      FROM Modules m
      LEFT JOIN Module_parts mp ON m.module_id = mp.module_id
      LEFT JOIN Shelving_units su ON mp.module_part_id = su.module_part_id
      LEFT JOIN Shelves s ON su.shelving_unit_id = s.shelving_unit_id
      WHERE m.is_deleted = 0`
    );

    return stats[0];
  } catch (error) {
    throw createApiError(
      'Database error while fetching library statistics',
      500,
      'DATABASE_ERROR'
    );
  }
}

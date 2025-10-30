/**
 * Routes Index
 * Central router configuration
 */

import { Router } from 'express';
import bookRoutes from './books';

const router = Router();

// API routes
router.use('/books', bookRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'BJFF Book Locator API'
  });
});

export default router;

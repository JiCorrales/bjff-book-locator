/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

import express, { Application } from 'express';
import cors from 'cors';
import * as path from 'path';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
require('dotenv').config();

const app: Application = express();

// ============================================
// Middleware Configuration
// ============================================

// CORS - Allow frontend to access API
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Serve static files (images from output_final)
const outputFinalPath = path.join(__dirname, '../../output_final');
app.use('/images', express.static(outputFinalPath));

// ============================================
// API Routes
// ============================================

app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BJFF Book Locator API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      search_post: 'POST /api/books/search',
      search_get: 'GET /api/books/search?code=XXX',
      stats: 'GET /api/books/stats',
      images: '/images/module{N}/{face}/s{unit}_r{shelf}.jpg'
    }
  });
});

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;

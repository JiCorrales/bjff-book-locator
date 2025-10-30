/**
 * Server Entry Point
 * Starts the Express application and connects to database
 */

import app from './app';
import { pool } from './config/database';

const PORT = process.env.PORT || 3000;

/**
 * Start the server
 */
async function startServer() {
  try {
    // Test database connection
    console.log(' Testing database connection...');
    await pool.query('SELECT 1');
    console.log(' Database connected successfully');

    // Start listening
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log(' BJFF Book Locator API Server');
      console.log('='.repeat(50));
      console.log(` Server running on: http://localhost:${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Database: ${process.env.DB_DATABASE}`);
      console.log('\n Available endpoints:');
      console.log(`   GET  /                     - API info`);
      console.log(`   GET  /api/health           - Health check`);
      console.log(`   POST /api/books/search     - Search book by code`);
      console.log(`   GET  /api/books/search     - Search book by code (query)`);
      console.log(`   GET  /api/books/stats      - Library statistics`);
      console.log(`   GET  /images/*             - Shelf images`);
      console.log('='.repeat(50) + '\n');
    });

  } catch (error) {
    console.error(' Failed to start server:', error);
    console.error('\nPlease check:');
    console.error('1. MySQL is running');
    console.error('2. .env file exists with correct credentials');
    console.error('3. Database "bjff_book_locator" exists');
    console.error('4. Run: npm run db:update-keys (if database is new)');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n SIGINT received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

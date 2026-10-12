const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const securityMiddleware = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');

// Ensure necessary directories exist
[config.dataDir, config.uploadsDir, config.templatesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

// 1. Security & CORS Middleware
app.use(securityMiddleware);

// 2. Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Static Assets
const clientDir = path.resolve(__dirname, '../client');
app.use(express.static(clientDir));
app.use('/uploads', express.static(config.uploadsDir));

// 4. API Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/import', require('./routes/import'));
app.use('/api/templates', require('./routes/templates'));

// 5. Fallback for SPA routing (serve index.html for non-API client routes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  res.sendFile(path.join(clientDir, 'index.html'));
});

// 6. 404 & Central Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if executed directly
if (require.main === module) {
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 ReverseBuilder Server active`);
    console.log(`📍 Web Interface: http://localhost:${config.port}`);
    console.log(`🛠️  Health Check:  http://localhost:${config.port}/api/health`);
    console.log(`📁 Projects Dir:  ${config.dataDir}`);
    console.log(`==================================================\n`);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, closing server...');
    server.close(() => process.exit(0));
  });
}

module.exports = app;

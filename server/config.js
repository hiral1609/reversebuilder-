const path = require('path');
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  env: process.env.NODE_ENV || 'development',
  dataDir: path.resolve(__dirname, 'data', 'projects'),
  uploadsDir: path.resolve(__dirname, 'data', 'uploads'),
  templatesDir: path.resolve(__dirname, 'data', 'templates'),
  maxUploadSizeBytes: 15 * 1024 * 1024, // 15MB
  allowedImageMimes: ['image/png', 'image/jpeg', 'image/webp'],
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  crawlerTimeoutMs: 15000,
  maxSectionsPerProject: 50
};

const express = require('express');
const router = express.Router();
const config = require('../config');
const aiVisionService = require('../services/ai-vision-service');

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ReverseBuilder API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      aiVisionConfigured: aiVisionService.isConfigured(),
      playwrightAvailable: Boolean(require('../services/crawler-service').playwright),
      exportEngine: 'JSZip 3.x'
    }
  });
});

module.exports = router;

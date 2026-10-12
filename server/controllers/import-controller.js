const path = require('path');
const fs = require('fs').promises;
const crawlerService = require('../services/crawler-service');
const reconstructionService = require('../services/reconstruction-service');
const fileStore = require('../storage/file-store');
const config = require('../config');

class ImportController {
  async importUrl(req, res, next) {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'Target URL is required.' });
      }

      // 1. Crawl URL, capture screenshots, extract DOM structure
      const crawlResult = await crawlerService.crawlUrl(url);

      // 2. Reconstruct JSON AST
      const projectData = reconstructionService.reconstructFromCrawledData(crawlResult);

      // 3. Persist as project
      const created = await fileStore.create(projectData);

      res.status(201).json({
        success: true,
        message: 'Website analyzed and reconstructed successfully',
        data: created,
        meta: {
          originalUrl: url,
          screenshotUrl: crawlResult.screenshotUrl,
          sectionCount: created.sections.length
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async importScreenshot(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Please upload an image file (PNG, JPEG, WebP).' });
      }

      const filePath = req.file.path;
      const screenshotUrl = `/uploads/${req.file.filename}`;
      const originalFilename = req.file.originalname;

      // Reconstruct project
      const result = await reconstructionService.reconstructFromScreenshot(filePath, screenshotUrl, originalFilename);
      const created = await fileStore.create(result.project);

      res.status(201).json({
        success: true,
        message: result.method === 'ai-vision'
          ? 'Screenshot analyzed via Vision AI and reconstructed.'
          : 'Screenshot processed. Heuristic reconstruction layout generated.',
        data: created,
        meta: {
          method: result.method,
          note: result.message || '',
          screenshotUrl
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadAsset(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image uploaded.' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        url: fileUrl,
        filename: req.file.originalname
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ImportController();
module.exports.ImportController = ImportController;

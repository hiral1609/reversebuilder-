const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const importController = require('../controllers/import-controller');

// Storage config for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.png';
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;
    cb(null, unique);
  }
});

const fileFilter = (req, file, cb) => {
  if (config.allowedImageMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (PNG, JPEG, WebP).'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadSizeBytes },
  fileFilter
});

// POST /api/import/url
router.post('/url', (req, res, next) => importController.importUrl(req, res, next));

// POST /api/import/screenshot
router.post('/screenshot', upload.single('screenshot'), (req, res, next) => importController.importScreenshot(req, res, next));

// POST /api/upload/image
router.post('/asset', upload.single('image'), (req, res, next) => importController.uploadAsset(req, res, next));

module.exports = router;

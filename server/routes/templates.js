const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

router.get('/', async (req, res, next) => {
  try {
    const templatesPath = path.resolve(__dirname, '../data/templates/templates.json');
    const raw = await fs.readFile(templatesPath, 'utf8');
    const templates = JSON.parse(raw);
    
    // Return summaries without huge AST payloads if requested, or full
    const summaries = templates.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description,
      thumbnail: t.thumbnail,
      theme: t.theme,
      sectionCount: t.sections.length
    }));

    res.json({ success: true, count: summaries.length, data: summaries });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const templatesPath = path.resolve(__dirname, '../data/templates/templates.json');
    const raw = await fs.readFile(templatesPath, 'utf8');
    const templates = JSON.parse(raw);
    const template = templates.find(t => t.id === req.params.id);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

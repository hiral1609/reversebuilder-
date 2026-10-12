const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects-controller');

// GET /api/projects
router.get('/', (req, res, next) => projectsController.listProjects(req, res, next));

// POST /api/projects
router.post('/', (req, res, next) => projectsController.createProject(req, res, next));

// GET /api/projects/:id
router.get('/:id', (req, res, next) => projectsController.getProject(req, res, next));

// PATCH /api/projects/:id
router.patch('/:id', (req, res, next) => projectsController.updateProject(req, res, next));

// DELETE /api/projects/:id
router.delete('/:id', (req, res, next) => projectsController.deleteProject(req, res, next));

// POST /api/projects/:id/duplicate
router.post('/:id/duplicate', (req, res, next) => projectsController.duplicateProject(req, res, next));

// POST /api/projects/:id/export
router.post('/:id/export', (req, res, next) => projectsController.exportProject(req, res, next));

module.exports = router;

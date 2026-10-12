const fs = require('fs').promises;
const path = require('path');
const fileStore = require('../storage/file-store');
const exportService = require('../services/export-service');
const { validateProject, generateId } = require('../validators/schema-validator');

class ProjectsController {
  async listProjects(req, res, next) {
    try {
      const { search = '', sort = 'updatedDesc' } = req.query;
      const projects = await fileStore.list({ search, sort });
      res.json({
        success: true,
        count: projects.length,
        data: projects
      });
    } catch (err) {
      next(err);
    }
  }

  async createProject(req, res, next) {
    try {
      const { name, templateId, theme, sections } = req.body;

      let projectToCreate = null;

      if (templateId) {
        // Clone from template
        const templatesPath = path.resolve(__dirname, '../data/templates/templates.json');
        const raw = await fs.readFile(templatesPath, 'utf8');
        const templates = JSON.parse(raw);
        const template = templates.find(t => t.id === templateId);

        if (!template) {
          return res.status(404).json({ success: false, error: `Template "${templateId}" not found.` });
        }

        projectToCreate = {
          name: name || template.name,
          description: template.description,
          theme: template.theme,
          reference: { type: 'template', source: template.id },
          sections: template.sections.map(s => ({
            ...s,
            id: generateId(s.type)
          }))
        };
      } else {
        // Create blank / custom project
        projectToCreate = {
          name: name || 'Untitled Project',
          theme: theme || {
            primaryColor: '#4f46e5',
            secondaryColor: '#06b6d4',
            backgroundColor: '#ffffff',
            textColor: '#0f172a',
            fontFamily: "'Inter', sans-serif"
          },
          reference: { type: 'manual' },
          sections: Array.isArray(sections) ? sections : []
        };
      }

      const created = await fileStore.create(projectToCreate);
      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: created
      });
    } catch (err) {
      next(err);
    }
  }

  async getProject(req, res, next) {
    try {
      const { id } = req.params;
      const project = await fileStore.getById(id);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      res.json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  }

  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await fileStore.update(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      res.json({
        success: true,
        message: 'Project updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async duplicateProject(req, res, next) {
    try {
      const { id } = req.params;
      const duplicated = await fileStore.duplicate(id);
      if (!duplicated) {
        return res.status(404).json({ success: false, error: 'Project not found to duplicate' });
      }
      res.status(201).json({
        success: true,
        message: 'Project duplicated successfully',
        data: duplicated
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await fileStore.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async exportProject(req, res, next) {
    try {
      const { id } = req.params;
      let project = await fileStore.getById(id);

      // Support passing draft state in request body for instant export of unsaved edits
      if (req.body && req.body.sections) {
        const validated = validateProject(req.body);
        if (validated.valid) {
          project = validated.project;
        }
      }

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const zipBuffer = await exportService.createZipArchive(project);
      const safeFilename = (project.name || 'project').toLowerCase().replace(/[^a-z0-9_-]/g, '-') + '.zip';

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Content-Length', zipBuffer.length);
      res.end(zipBuffer);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProjectsController();
module.exports.ProjectsController = ProjectsController;

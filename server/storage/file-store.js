const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const { validateProject, generateId } = require('../validators/schema-validator');

class FileStore {
  constructor(baseDir = config.dataDir) {
    this.baseDir = baseDir;
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (err) {
      console.error(`Failed to initialize data dir: ${err.message}`);
    }
  }

  _sanitizeId(id) {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid project ID: ID must be a non-empty string');
    }
    // Strict alphanumeric, dash, and underscore only. Reject any path characters.
    if (!/^[a-zA-Z0-9_-]+$/.test(id) || id.includes('..') || id.includes('/') || id.includes('\\')) {
      throw new Error('Invalid project ID format: Security violation');
    }
    return id;
  }

  _getFilePath(id) {
    const safeId = this._sanitizeId(id);
    return path.join(this.baseDir, `${safeId}.json`);
  }

  /**
   * Atomic file writing
   */
  async _writeAtomic(filePath, data) {
    const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(tempPath, content, 'utf8');
    await fs.rename(tempPath, filePath);
  }

  async create(projectData) {
    const validation = validateProject(projectData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const project = validation.project;
    const filePath = this._getFilePath(project.id);

    await this._writeAtomic(filePath, project);
    return project;
  }

  async getById(id) {
    const filePath = this._getFilePath(id);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content);
      const validation = validateProject(parsed);
      return validation.project;
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  async list({ search = '', sort = 'updatedDesc' } = {}) {
    await this.init();
    let files = [];
    try {
      files = await fs.readdir(this.baseDir);
    } catch (err) {
      return [];
    }

    const projects = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const filePath = path.join(this.baseDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const project = JSON.parse(content);
        projects.push({
          id: project.id,
          name: project.name,
          description: project.description,
          reference: project.reference,
          sectionCount: Array.isArray(project.sections) ? project.sections.length : 0,
          theme: project.theme,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        });
      } catch (e) {
        // Skip corrupt or unreadable files
      }
    }

    // Filter by search
    let filtered = projects;
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.reference?.source && p.reference.source.toLowerCase().includes(term))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sort === 'nameAsc') return (a.name || '').localeCompare(b.name || '');
      if (sort === 'nameDesc') return (b.name || '').localeCompare(a.name || '');
      if (sort === 'createdAsc') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sort === 'createdDesc') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sort === 'updatedAsc') return (a.updatedAt || 0) - (b.updatedAt || 0);
      // Default: updatedDesc
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    return filtered;
  }

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const merged = {
      ...existing,
      ...updates,
      id: existing.id, // ID cannot be changed
      createdAt: existing.createdAt,
      updatedAt: Date.now()
    };

    const validation = validateProject(merged);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const filePath = this._getFilePath(existing.id);
    await this._writeAtomic(filePath, validation.project);
    return validation.project;
  }

  async duplicate(id) {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const duplicateProject = {
      ...existing,
      id: generateId('proj'),
      name: `${existing.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const filePath = this._getFilePath(duplicateProject.id);
    await this._writeAtomic(filePath, duplicateProject);
    return duplicateProject;
  }

  async delete(id) {
    const filePath = this._getFilePath(id);
    try {
      await fs.unlink(filePath);
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }
}

module.exports = new FileStore();
module.exports.FileStore = FileStore;

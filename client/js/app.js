/**
 * ReverseBuilder Master Application Controller
 */
const App = {
  async init() {
    console.log("Initializing ReverseBuilder...");

    // 1. Initialize Inspector and Router
    if (window.Inspector) window.Inspector.init();

    // 2. Bind Global Event Handlers
    this.bindGlobalEvents();
    this.bindLandingInteractions();
    this.bindDashboardEvents();
    this.bindEditorEvents();
    this.bindModals();

    // 3. Start Router
    if (window.Router) window.Router.init();
  },

  /* ========================================================================
     1. Landing Page Interactions
     ======================================================================== */
  bindLandingInteractions() {
    // Before & After Reconstruction Slider
    const wrapper = document.getElementById('comparison-wrapper');
    const afterBox = document.getElementById('comparison-after');
    const handle = document.getElementById('comparison-handle');

    if (wrapper && afterBox && handle) {
      let isDragging = false;

      const updateSlider = (clientX) => {
        const rect = wrapper.getBoundingClientRect();
        let posX = clientX - rect.left;
        posX = Math.max(0, Math.min(posX, rect.width));
        const percentage = (posX / rect.width) * 100;

        afterBox.style.width = `${percentage}%`;
        handle.style.left = `${percentage}%`;
      };

      const startDrag = (e) => {
        isDragging = true;
        updateSlider(e.clientX || e.touches[0].clientX);
      };

      const stopDrag = () => { isDragging = false; };

      const onMove = (e) => {
        if (!isDragging) return;
        updateSlider(e.clientX || (e.touches && e.touches[0].clientX));
      };

      handle.addEventListener('mousedown', startDrag);
      wrapper.addEventListener('mousedown', startDrag);
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('mousemove', onMove);

      handle.addEventListener('touchstart', startDrag, { passive: true });
      wrapper.addEventListener('touchstart', startDrag, { passive: true });
      window.addEventListener('touchend', stopDrag);
      window.addEventListener('touchmove', onMove, { passive: true });
    }

    // FAQ Accordion
    document.querySelectorAll('.faq-item').forEach(item => {
      const question = item.querySelector('.faq-question');
      question?.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    });
  },

  async loadLandingTemplates() {
    const grid = document.getElementById('landing-templates-grid');
    if (!grid) return;

    try {
      const templates = await API.getTemplates();
      grid.innerHTML = templates.slice(0, 3).map(tpl => `
        <div class="template-card">
          <img src="${tpl.thumbnail || ''}" alt="${escapeHtmlText(tpl.name)}" class="template-thumb" loading="lazy">
          <div class="template-content">
            <span class="template-category">${tpl.category || 'Template'}</span>
            <h3 class="template-name">${escapeHtmlText(tpl.name)}</h3>
            <p class="template-desc">${escapeHtmlText(tpl.description)}</p>
            <button class="btn btn-primary btn-sm btn-use-template" data-tpl-id="${tpl.id}">Open in Editor →</button>
          </div>
        </div>
      `).join('\n');

      grid.querySelectorAll('.btn-use-template').forEach(btn => {
        btn.addEventListener('click', async () => {
          const tplId = btn.getAttribute('data-tpl-id');
          await this.createProjectFromTemplate(tplId);
        });
      });
    } catch (err) {
      console.warn('Could not load landing templates:', err);
    }
  },

  /* ========================================================================
     2. Dashboard Management
     ======================================================================== */
  bindDashboardEvents() {
    // Search input
    const searchInput = document.getElementById('dash-search-input');
    searchInput?.addEventListener('input', () => {
      this.loadDashboardProjects();
    });

    // Sort select
    const sortSelect = document.getElementById('dash-sort-select');
    sortSelect?.addEventListener('change', () => {
      this.loadDashboardProjects();
    });
  },

  async loadDashboardProjects() {
    const grid = document.getElementById('dashboard-projects-grid');
    if (!grid) return;

    const search = document.getElementById('dash-search-input')?.value || '';
    const sort = document.getElementById('dash-sort-select')?.value || 'updatedDesc';

    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;"><div class="spinner"></div></div>';

    try {
      const projects = await API.getProjects({ search, sort });

      if (projects.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">⚡</div>
            <h3 class="empty-state-title">${search ? 'No Matching Projects' : 'No Projects Yet'}</h3>
            <p class="empty-state-desc">${search ? 'Try adjusting your search terms or create a new project.' : 'Start by importing an existing website reference, uploading a screenshot, or using a template.'}</p>
            <div class="empty-state-actions">
              <button class="btn btn-primary" id="empty-btn-url">Import by URL</button>
              <button class="btn btn-secondary" id="empty-btn-upload">Upload Screenshot</button>
            </div>
          </div>`;

        document.getElementById('empty-btn-url')?.addEventListener('click', () => this.openModal('modal-import-url'));
        document.getElementById('empty-btn-upload')?.addEventListener('click', () => this.openModal('modal-import-screenshot'));
        return;
      }

      grid.innerHTML = projects.map(proj => {
        const lastUpdated = new Date(proj.updatedAt || proj.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const thumbSrc = proj.reference?.screenshotUrl || '';
        const thumbHtml = thumbSrc
          ? `<img src="${thumbSrc}" alt="Snapshot" class="project-thumbnail-img" loading="lazy">`
          : `<div class="project-mock-badge">${proj.sectionCount || 0} Sections</div>`;

        return `
          <div class="project-card" data-project-id="${proj.id}">
            <div class="project-thumbnail-wrapper btn-open-project" data-id="${proj.id}">
              ${thumbHtml}
            </div>
            <div class="project-card-body">
              <div class="project-title-row">
                <h3 class="project-name btn-open-project" data-id="${proj.id}">${escapeHtmlText(proj.name)}</h3>
              </div>
              <p class="project-desc">${escapeHtmlText(proj.description || 'No description provided.')}</p>
              <div class="project-meta-row">
                <span>Updated ${lastUpdated}</span>
                <div class="project-actions-btn-group">
                  <button class="btn btn-ghost btn-sm btn-proj-dupe" data-id="${proj.id}" title="Duplicate Project">📋</button>
                  <button class="btn btn-ghost btn-sm btn-proj-delete" data-id="${proj.id}" title="Delete Project">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('\n');

      // Bind Project Card Clicks
      grid.querySelectorAll('.btn-open-project').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.getAttribute('data-id');
          Router.navigate(`/editor?id=${id}`);
        });
      });

      // Duplicate Project
      grid.querySelectorAll('.btn-proj-dupe').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          try {
            showToast('Duplicating project...', 'info');
            await API.duplicateProject(id);
            showToast('Project duplicated successfully!', 'success');
            await this.loadDashboardProjects();
          } catch (err) {
            showToast(`Duplicate failed: ${err.message}`, 'error');
          }
        });
      });

      // Delete Project
      grid.querySelectorAll('.btn-proj-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
              await API.deleteProject(id);
              showToast('Project deleted', 'info');
              await this.loadDashboardProjects();
            } catch (err) {
              showToast(`Delete failed: ${err.message}`, 'error');
            }
          }
        });
      });
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1; color:var(--color-error); text-align:center;">Failed to load projects: ${err.message}</div>`;
    }
  },

  /* ========================================================================
     3. Visual Editor Workbench
     ======================================================================== */
  bindEditorEvents() {
    // Project Title Input
    const titleInput = document.getElementById('project-title-input');
    titleInput?.addEventListener('input', (e) => {
      State.updateProject(p => { p.name = e.target.value; });
    });

    // Undo / Redo buttons
    document.getElementById('btn-undo')?.addEventListener('click', () => HistoryManager.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => HistoryManager.redo());

    // Viewport presets (Desktop, Tablet, Mobile)
    document.querySelectorAll('.viewport-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.viewport-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        this.setViewportMode(mode);
      });
    });

    // Preview Mode Toggle
    const previewToggle = document.getElementById('btn-preview-mode');
    previewToggle?.addEventListener('click', () => {
      const isPreview = !State.get('isPreviewMode');
      State.set('isPreviewMode', isPreview);
      previewToggle.classList.toggle('btn-primary', isPreview);
      previewToggle.classList.toggle('btn-outline', !isPreview);
      previewToggle.textContent = isPreview ? '✏️ Edit Mode' : '👁️ Preview';
      Renderer.renderCanvas(State.get('currentProject'), document.getElementById('canvas-device-wrapper'));
    });

    // Manual Save Button
    document.getElementById('btn-save-project')?.addEventListener('click', async () => {
      await this.saveCurrentProject();
    });

    // Export ZIP Button
    document.getElementById('btn-export-project')?.addEventListener('click', async () => {
      const project = State.get('currentProject');
      if (!project) return;
      try {
        showToast('Packaging clean HTML, CSS & vanilla JS archive...', 'info', 2000);
        await API.exportProject(project.id, project);
        showToast('Download started! Ready to deploy.', 'success');
      } catch (err) {
        showToast(`Export failed: ${err.message}`, 'error');
      }
    });

    // Left Sidebar Tab Switching
    document.querySelectorAll('.sidebar-left-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-left-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        const tab = tabBtn.getAttribute('data-tab');
        this.setSidebarTab(tab);
      });
    });

    // Populate Components Palette
    this.populateComponentsPalette();
  },

  populateComponentsPalette() {
    const paletteGrid = document.getElementById('components-palette-grid');
    if (!paletteGrid) return;

    const components = ComponentRegistry.getAll();
    paletteGrid.innerHTML = components.map(comp => `
      <div class="palette-item" data-type="${comp.type}">
        <span class="palette-item-icon">${comp.icon}</span>
        <span class="palette-item-label">${comp.name}</span>
      </div>
    `).join('\n');

    // Click palette item to append section
    paletteGrid.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.getAttribute('data-type');
        this.addSectionToProject(type);
      });
    });
  },

  addSectionToProject(type) {
    const newSection = ComponentRegistry.createInstance(type);
    State.updateProject(project => {
      project.sections.push(newSection);
    });

    State.set('selectedSectionId', newSection.id);
    Renderer.renderCanvas(State.get('currentProject'), document.getElementById('canvas-device-wrapper'));
    this.renderLayersTree();
    showToast(`Added ${newSection.name}`, 'success', 1500);

    // Scroll new section into view
    setTimeout(() => {
      const secEl = document.querySelector(`[data-section-id="${newSection.id}"]`);
      secEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  },

  setViewportMode(mode) {
    State.set('viewportMode', mode);
    const canvasWrapper = document.getElementById('canvas-device-wrapper');
    if (!canvasWrapper) return;

    canvasWrapper.classList.remove('viewport-desktop', 'viewport-tablet', 'viewport-mobile');
    canvasWrapper.classList.add(`viewport-${mode}`);
  },

  setSidebarTab(tab) {
    State.set('sidebarTab', tab);
    document.querySelectorAll('.sidebar-tab-panel').forEach(p => p.style.display = 'none');
    const target = document.getElementById(`tab-panel-${tab}`);
    if (target) {
      target.style.display = 'block';
    }

    if (tab === 'layers') {
      this.renderLayersTree();
    } else if (tab === 'reference') {
      this.renderReferenceDrawer();
    }
  },

  renderLayersTree() {
    const listEl = document.getElementById('layers-tree-list');
    if (!listEl) return;

    const project = State.get('currentProject');
    if (!project || !project.sections || project.sections.length === 0) {
      listEl.innerHTML = '<p style="color:var(--text-dim); text-align:center; padding:20px;">No sections yet</p>';
      return;
    }

    const selectedId = State.get('selectedSectionId');

    listEl.innerHTML = project.sections.map((sec, idx) => {
      const isSelected = sec.id === selectedId;
      const def = ComponentRegistry.get(sec.type);

      return `
        <div class="layer-item ${isSelected ? 'active' : ''}" data-id="${sec.id}">
          <div class="layer-item-title">
            <span>${def.icon}</span>
            <span>${escapeHtmlText(sec.name || def.name)}</span>
          </div>
          <div class="layer-actions">
            <button class="layer-action-btn btn-layer-up" data-id="${sec.id}" title="Move Up" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button class="layer-action-btn btn-layer-down" data-id="${sec.id}" title="Move Down" ${idx === project.sections.length - 1 ? 'disabled' : ''}>▼</button>
            <button class="layer-action-btn btn-layer-del" data-id="${sec.id}" title="Delete">✕</button>
          </div>
        </div>
      `;
    }).join('\n');

    // Bind Layer Clicks
    listEl.querySelectorAll('.layer-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.layer-actions')) return;
        const id = item.getAttribute('data-id');
        State.set('selectedSectionId', id);
        Renderer.renderCanvas(State.get('currentProject'), document.getElementById('canvas-device-wrapper'));
        this.renderLayersTree();

        // Scroll into view in canvas
        const secEl = document.querySelector(`[data-section-id="${id}"]`);
        secEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    listEl.querySelectorAll('.btn-layer-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Renderer.handleSectionAction('move-up', btn.getAttribute('data-id'));
        this.renderLayersTree();
      });
    });

    listEl.querySelectorAll('.btn-layer-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Renderer.handleSectionAction('move-down', btn.getAttribute('data-id'));
        this.renderLayersTree();
      });
    });

    listEl.querySelectorAll('.btn-layer-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Renderer.handleSectionAction('delete', btn.getAttribute('data-id'));
        this.renderLayersTree();
      });
    });
  },

  renderReferenceDrawer() {
    const container = document.getElementById('reference-drawer-container');
    if (!container) return;

    const project = State.get('currentProject');
    const ref = project?.reference;

    if (!ref || (!ref.source && !ref.screenshotUrl)) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-dim);">
          <div style="font-size:2rem; margin-bottom:8px;">🔍</div>
          <p>No reference attached to this project.</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="reference-drawer-content">
        <div style="font-size:0.85rem; color:var(--text-muted);">
          <strong>Source:</strong> ${escapeHtmlText(ref.source || 'Uploaded Screenshot')}
        </div>
        ${ref.screenshotUrl ? `
        <div class="reference-preview-box">
          <img src="${ref.screenshotUrl}" alt="Reference Snapshot" class="reference-preview-img">
        </div>` : '<p style="color:var(--text-dim);">No snapshot image captured.</p>'}
      </div>
    `;
  },

  async loadProjectIntoEditor(projectId) {
    try {
      showToast('Loading project...', 'info', 1500);
      const project = await API.getProject(projectId);

      State.state.currentProject = project;
      State.state.selectedSectionId = null;
      State.state.isDirty = false;
      State.state.saveStatus = 'saved';

      // Update Topbar
      const titleInput = document.getElementById('project-title-input');
      if (titleInput) titleInput.value = project.name || 'Untitled Project';

      this.updateSaveIndicator('saved');

      // Clear undo history
      HistoryManager.clear();

      // Render Canvas
      Renderer.renderCanvas(project, document.getElementById('canvas-device-wrapper'));

      // Render Layers & Inspector
      this.renderLayersTree();
      Inspector.renderInspector();

      document.title = `${project.name} - ReverseBuilder Editor`;
    } catch (err) {
      showToast(`Failed to open project: ${err.message}`, 'error');
      Router.navigate('/dashboard');
    }
  },

  async saveCurrentProject() {
    const project = State.get('currentProject');
    if (!project) return;

    try {
      this.updateSaveIndicator('saving');
      const updated = await API.updateProject(project.id, project);
      State.state.currentProject = updated;
      State.state.isDirty = false;
      this.updateSaveIndicator('saved');
      showToast('Project saved successfully!', 'success', 2000);
    } catch (err) {
      this.updateSaveIndicator('unsaved');
      showToast(`Save failed: ${err.message}`, 'error');
    }
  },

  updateSaveIndicator(status) {
    const indicator = document.getElementById('save-indicator');
    if (!indicator) return;

    const dot = indicator.querySelector('.save-dot');
    const text = indicator.querySelector('.save-text');

    if (dot) {
      dot.className = `save-dot ${status}`;
    }

    if (text) {
      text.textContent = status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving...' : 'Unsaved changes';
    }
  },

  /* ========================================================================
     4. Modals & Project Creation
     ======================================================================== */
  bindModals() {
    // Modal Close Buttons
    document.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('open');
      });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });

    // Global Action Buttons opening Modals
    document.querySelectorAll('.trigger-modal-url').forEach(btn => {
      btn.addEventListener('click', () => this.openModal('modal-import-url'));
    });

    document.querySelectorAll('.trigger-modal-screenshot').forEach(btn => {
      btn.addEventListener('click', () => this.openModal('modal-import-screenshot'));
    });

    document.querySelectorAll('.trigger-modal-new').forEach(btn => {
      btn.addEventListener('click', () => this.openModal('modal-new-project'));
    });

    // Form Submissions
    // 1. URL Import Form
    const urlForm = document.getElementById('form-import-url');
    urlForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('import-url-input');
      const url = input?.value.trim();
      if (!url) return;

      const submitBtn = urlForm.querySelector('button[type="submit"]');
      const statusEl = document.getElementById('import-url-status');

      try {
        if (submitBtn) submitBtn.disabled = true;
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.innerHTML = '<div class="spinner"></div> Crawling site & reverse engineering layout...';
        }

        const res = await API.importUrl(url);
        showToast('Website reconstructed successfully!', 'success');
        this.closeModal('modal-import-url');
        urlForm.reset();
        Router.navigate(`/editor?id=${res.data.id}`);
      } catch (err) {
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:var(--color-error);">${err.message}</span>`;
        }
        showToast(`Import failed: ${err.message}`, 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    // 2. Screenshot Import Form
    const screenshotForm = document.getElementById('form-import-screenshot');
    const screenshotInput = document.getElementById('import-file-input');
    const dropzone = document.getElementById('screenshot-dropzone');
    const previewContainer = document.getElementById('screenshot-preview-container');
    const previewImg = document.getElementById('screenshot-preview-img');

    if (dropzone && screenshotInput) {
      dropzone.addEventListener('click', () => screenshotInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          screenshotInput.files = e.dataTransfer.files;
          this.handleScreenshotSelected(e.dataTransfer.files[0], previewContainer, previewImg);
        }
      });

      screenshotInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleScreenshotSelected(e.target.files[0], previewContainer, previewImg);
        }
      });
    }

    screenshotForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = screenshotInput?.files?.[0];
      if (!file) {
        showToast('Please select a screenshot image.', 'error');
        return;
      }

      const submitBtn = screenshotForm.querySelector('button[type="submit"]');
      const statusEl = document.getElementById('import-screenshot-status');

      try {
        if (submitBtn) submitBtn.disabled = true;
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.innerHTML = '<div class="spinner"></div> Reconstructing layout from screenshot...';
        }

        const res = await API.importScreenshot(file);
        showToast(res.message || 'Reconstructed successfully!', 'success');
        this.closeModal('modal-import-screenshot');
        screenshotForm.reset();
        if (previewContainer) previewContainer.style.display = 'none';
        Router.navigate(`/editor?id=${res.data.id}`);
      } catch (err) {
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:var(--color-error);">${err.message}</span>`;
        }
        showToast(`Screenshot import failed: ${err.message}`, 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    // 3. New Blank Project Form
    const newProjForm = document.getElementById('form-new-project');
    newProjForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('new-proj-name-input')?.value.trim() || 'Untitled Project';
      const templateId = document.getElementById('new-proj-template-select')?.value || '';

      try {
        const payload = { name };
        if (templateId) payload.templateId = templateId;

        const proj = await API.createProject(payload);
        showToast('Project created!', 'success');
        this.closeModal('modal-new-project');
        newProjForm.reset();
        Router.navigate(`/editor?id=${proj.id}`);
      } catch (err) {
        showToast(`Failed to create project: ${err.message}`, 'error');
      }
    });
  },

  handleScreenshotSelected(file, container, img) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please upload a valid image (PNG, JPEG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (img) img.src = e.target.result;
      if (container) container.style.display = 'block';
    };
    reader.readAsDataURL(file);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      const input = modal.querySelector('input');
      input?.focus();
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  },

  async createProjectFromTemplate(templateId) {
    try {
      showToast('Creating project from template...', 'info');
      const proj = await API.createProject({ templateId });
      showToast('Template cloned! Opening editor...', 'success');
      Router.navigate(`/editor?id=${proj.id}`);
    } catch (err) {
      showToast(`Failed to clone template: ${err.message}`, 'error');
    }
  },

  /* ========================================================================
     5. Global Keyboard Shortcuts
     ======================================================================== */
  bindGlobalEvents() {
    window.addEventListener('keydown', (e) => {
      // Save Shortcut (Ctrl+S or Cmd+S)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (State.get('currentView') === 'editor') {
          this.saveCurrentProject();
        }
      }

      // Undo (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (State.get('currentView') === 'editor' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          e.preventDefault();
          HistoryManager.undo();
        }
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        if (State.get('currentView') === 'editor' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          e.preventDefault();
          HistoryManager.redo();
        }
      }

      // Close modal on Escape
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      }
    });
  }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

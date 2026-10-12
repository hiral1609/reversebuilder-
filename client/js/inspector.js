/**
 * ReverseBuilder Properties & Element Inspector
 * Supports deep element-level editing (text, font family, font size, color, background, padding, links, images)
 * as well as section-level and global page styling.
 */
const Inspector = {
  currentElement: null,

  init() {
    State.subscribe('selectedSectionId', () => {
      if (!this.currentElement) {
        this.renderInspector();
      }
    });

    State.subscribe('currentProject', () => {
      if (!this.currentElement && document.getElementById('inspector-body')) {
        this.renderInspector();
      }
    });
  },

  updateTextField(newVal) {
    const txtInp = document.getElementById('inp-el-text');
    if (txtInp && document.activeElement !== txtInp) {
      txtInp.value = newVal;
    }
  },

  /**
   * Main entry for rendering inspector:
   * If an element is selected, renders Element Inspector.
   * Otherwise renders Section or Global settings.
   */
  renderInspector() {
    const bodyEl = document.getElementById('inspector-body');
    const titleEl = document.getElementById('inspector-title');
    if (!bodyEl) return;

    if (this.currentElement && document.body.contains(this.currentElement)) {
      const secEl = this.currentElement.closest('.canvas-section');
      const secId = secEl ? secEl.getAttribute('data-section-id') : null;
      this.renderElementInspector(this.currentElement, secId);
      return;
    }

    this.currentElement = null;

    const project = State.get('currentProject');
    if (!project) {
      bodyEl.innerHTML = '<p style="color:var(--text-dim); text-align:center;">No project active</p>';
      return;
    }

    const selectedId = State.get('selectedSectionId');
    const selectedSection = project.sections.find(s => s.id === selectedId);

    if (!selectedSection) {
      if (titleEl) titleEl.textContent = 'Project & Theme Settings';
      this.renderGlobalSettings(bodyEl, project);
      return;
    }

    if (titleEl) titleEl.textContent = `${selectedSection.name || 'Section'} Properties`;
    this.renderSectionInspector(bodyEl, selectedSection);
  },

  /**
   * DEEP ELEMENT-LEVEL INSPECTOR
   */
  renderElementInspector(el, sectionId) {
    this.currentElement = el;
    const bodyEl = document.getElementById('inspector-body');
    const titleEl = document.getElementById('inspector-title');
    if (!bodyEl) return;

    const tagName = el.tagName.toUpperCase();
    if (titleEl) titleEl.textContent = `Inspect <${tagName}>`;

    const computed = window.getComputedStyle(el);
    const textContent = el.innerText || el.textContent || '';
    const isImage = el.tagName.toLowerCase() === 'img';
    const linkEl = el.tagName.toLowerCase() === 'a' ? el : el.closest('a');
    const isLink = !!linkEl || el.tagName.toLowerCase() === 'button';
    const currentHref = linkEl ? (linkEl.getAttribute('data-target-href') || linkEl.getAttribute('href') || '#') : (el.getAttribute('href') || '#');

    // Helper to convert rgb(...) to hex
    const rgbToHex = (col) => {
      if (!col || col === 'transparent' || col.includes('rgba(0, 0, 0, 0)')) return '#ffffff';
      if (col.startsWith('#')) return col;
      const rgb = col.match(/\d+/g);
      if (!rgb || rgb.length < 3) return '#000000';
      return '#' + ((1 << 24) + (+rgb[0] << 16) + (+rgb[1] << 8) + +rgb[2]).toString(16).slice(1);
    };

    const textColorHex = rgbToHex(computed.color);
    const bgColorHex = rgbToHex(computed.backgroundColor);
    const fontSizePx = parseInt(computed.fontSize, 10) || 16;
    const fontWeightVal = computed.fontWeight || '400';
    const fontFamilyVal = computed.fontFamily || "'Inter', sans-serif";

    bodyEl.innerHTML = `
      <!-- Element Header Badge & Deselect -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <span class="badge" style="font-family:var(--font-mono);">&lt;${tagName}&gt;</span>
        <button class="btn btn-ghost btn-sm" id="btn-back-to-section" title="Back to Section Settings">↑ Section</button>
      </div>

      <!-- 1. Text Content Editor -->
      ${!isImage ? `
      <div>
        <div class="inspector-group-title">Text Content</div>
        <div class="form-group">
          <textarea class="input-textarea" id="inp-el-text" rows="3" placeholder="Enter text...">${escapeHtmlText(textContent)}</textarea>
          <span style="font-size:0.75rem; color:var(--text-dim); margin-top:4px; display:block;">Tip: Double-click text directly on canvas to edit in place.</span>
        </div>
      </div>` : ''}

      <!-- 2. Typography Controls -->
      <div>
        <div class="inspector-group-title">Typography & Font</div>
        <div class="form-group">
          <label class="form-label">Font Family</label>
          <select class="input-select" id="inp-el-font">
            <option value="'Inter', sans-serif">Inter (Modern Sans)</option>
            <option value="'Roboto', sans-serif">Roboto</option>
            <option value="'Poppins', sans-serif">Poppins</option>
            <option value="'Montserrat', sans-serif">Montserrat</option>
            <option value="'Open Sans', sans-serif">Open Sans</option>
            <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
            <option value="'Georgia', serif">Georgia</option>
            <option value="'Arial', sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'JetBrains Mono', monospace">JetBrains Mono (Code)</option>
            <option value="system-ui, sans-serif">System Default</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Font Size (<span id="val-el-size">${fontSizePx}</span>px)</label>
          <div class="input-range-row">
            <input type="range" class="input-range" id="inp-el-size" min="9" max="96" step="1" value="${fontSizePx}">
            <span class="range-val">${fontSizePx}px</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Font Weight</label>
          <select class="input-select" id="inp-el-weight">
            <option value="300" ${fontWeightVal === '300' ? 'selected' : ''}>300 (Light)</option>
            <option value="400" ${['400', 'normal'].includes(fontWeightVal) ? 'selected' : ''}>400 (Regular)</option>
            <option value="500" ${fontWeightVal === '500' ? 'selected' : ''}>500 (Medium)</option>
            <option value="600" ${fontWeightVal === '600' ? 'selected' : ''}>600 (Semi-Bold)</option>
            <option value="700" ${['700', 'bold'].includes(fontWeightVal) ? 'selected' : ''}>700 (Bold)</option>
            <option value="800" ${fontWeightVal === '800' ? 'selected' : ''}>800 (Extra-Bold)</option>
            <option value="900" ${fontWeightVal === '900' ? 'selected' : ''}>900 (Black)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Text Color</label>
          <div class="input-color-row">
            <input type="color" class="input-color" id="inp-el-color" value="${textColorHex}">
            <input type="text" class="input-text" id="inp-el-color-txt" value="${textColorHex}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Text Alignment</label>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline btn-sm btn-align" data-align="left" style="flex:1;">Left</button>
            <button class="btn btn-outline btn-sm btn-align" data-align="center" style="flex:1;">Center</button>
            <button class="btn btn-outline btn-sm btn-align" data-align="right" style="flex:1;">Right</button>
          </div>
        </div>
      </div>

      <!-- 3. Background & Styling -->
      <div>
        <div class="inspector-group-title">Background & Borders</div>
        <div class="form-group">
          <label class="form-label">Background Color</label>
          <div class="input-color-row">
            <input type="color" class="input-color" id="inp-el-bg" value="${bgColorHex}">
            <input type="text" class="input-text" id="inp-el-bg-txt" value="${bgColorHex}">
            <button class="btn btn-ghost btn-sm" id="btn-el-bg-clear" title="Make Background Transparent">Clear</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Padding</label>
          <div class="input-range-row">
            <input type="range" class="input-range" id="inp-el-pad" min="0" max="80" step="2" value="${parseInt(computed.paddingTop, 10) || 0}">
            <span class="range-val" id="val-el-pad">${parseInt(computed.paddingTop, 10) || 0}px</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Corner Radius</label>
          <div class="input-range-row">
            <input type="range" class="input-range" id="inp-el-radius" min="0" max="40" step="2" value="${parseInt(computed.borderRadius, 10) || 0}">
            <span class="range-val" id="val-el-radius">${parseInt(computed.borderRadius, 10) || 0}px</span>
          </div>
        </div>
      </div>

      <!-- 4. Image / Link Specifics -->
      ${isImage ? `
      <div>
        <div class="inspector-group-title">Image Source</div>
        <div class="form-group">
          <label class="form-label">Image URL</label>
          <input type="text" class="input-text" id="inp-el-img-src" value="${escapeHtmlText(el.getAttribute('src') || '')}">
          <div style="margin-top:8px;">
            <label class="btn btn-secondary btn-sm" style="display:flex; width:100%; cursor:pointer; justify-content:center;">
              📤 Replace Image
              <input type="file" id="inp-el-img-file" accept="image/*" style="display:none;">
            </label>
          </div>
        </div>
      </div>` : ''}

      ${isLink ? `
      <div>
        <div class="inspector-group-title">Link Destination</div>
        <div class="form-group">
          <label class="form-label">Href URL</label>
          <input type="text" class="input-text" id="inp-el-href" value="${escapeHtmlText(currentHref)}" placeholder="https://example.com or #features">
        </div>
      </div>` : ''}

      <!-- 5. Delete Element Action -->
      <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border-subtle);">
        <button class="btn btn-danger btn-sm" style="width:100%;" id="btn-delete-element">🗑️ Delete Element</button>
      </div>
    `;

    // 1. Text input live binding
    const textInp = bodyEl.querySelector('#inp-el-text');
    textInp?.addEventListener('input', (e) => {
      el.innerText = e.target.value;
      Renderer.syncElementChanges(el);
    });

    // 2. Font family selector
    const fontInp = bodyEl.querySelector('#inp-el-font');
    if (fontInp) {
      fontInp.value = fontFamilyVal.includes('Roboto') ? "'Roboto', sans-serif" :
        fontFamilyVal.includes('Poppins') ? "'Poppins', sans-serif" :
        fontFamilyVal.includes('Montserrat') ? "'Montserrat', sans-serif" :
        fontFamilyVal.includes('Georgia') ? "'Georgia', serif" :
        fontFamilyVal.includes('Arial') ? "'Arial', sans-serif" :
        fontFamilyVal.includes('Times') ? "'Times New Roman', serif" :
        fontFamilyVal.includes('JetBrains') ? "'JetBrains Mono', monospace" :
        "'Inter', sans-serif";

      fontInp.addEventListener('change', (e) => {
        el.style.fontFamily = e.target.value;
        Renderer.syncElementChanges(el);
      });
    }

    // 3. Font size slider
    const sizeInp = bodyEl.querySelector('#inp-el-size');
    sizeInp?.addEventListener('input', (e) => {
      const px = `${e.target.value}px`;
      el.style.fontSize = px;
      const valDisp = bodyEl.querySelector('#val-el-size');
      if (valDisp) valDisp.textContent = e.target.value;
      const rangeDisp = sizeInp.closest('.form-group')?.querySelector('.range-val');
      if (rangeDisp) rangeDisp.textContent = px;
      Renderer.syncElementChanges(el);
    });

    // 4. Font weight
    const weightInp = bodyEl.querySelector('#inp-el-weight');
    weightInp?.addEventListener('change', (e) => {
      el.style.fontWeight = e.target.value;
      Renderer.syncElementChanges(el);
    });

    // 5. Text color
    const colorInp = bodyEl.querySelector('#inp-el-color');
    const colorTxt = bodyEl.querySelector('#inp-el-color-txt');
    colorInp?.addEventListener('input', (e) => {
      colorTxt.value = e.target.value;
      el.style.color = e.target.value;
      Renderer.syncElementChanges(el);
    });
    colorTxt?.addEventListener('change', (e) => {
      colorInp.value = e.target.value;
      el.style.color = e.target.value;
      Renderer.syncElementChanges(el);
    });

    // 6. Text align buttons
    bodyEl.querySelectorAll('.btn-align').forEach(b => {
      b.addEventListener('click', () => {
        const align = b.getAttribute('data-align');
        el.style.textAlign = align;
        Renderer.syncElementChanges(el);
      });
    });

    // 7. Background color
    const bgInp = bodyEl.querySelector('#inp-el-bg');
    const bgTxt = bodyEl.querySelector('#inp-el-bg-txt');
    bgInp?.addEventListener('input', (e) => {
      bgTxt.value = e.target.value;
      el.style.backgroundColor = e.target.value;
      Renderer.syncElementChanges(el);
    });
    bgTxt?.addEventListener('change', (e) => {
      bgInp.value = e.target.value;
      el.style.backgroundColor = e.target.value;
      Renderer.syncElementChanges(el);
    });

    bodyEl.querySelector('#btn-el-bg-clear')?.addEventListener('click', () => {
      el.style.backgroundColor = 'transparent';
      if (bgTxt) bgTxt.value = 'transparent';
      Renderer.syncElementChanges(el);
    });

    // 8. Padding
    const padInp = bodyEl.querySelector('#inp-el-pad');
    padInp?.addEventListener('input', (e) => {
      const px = `${e.target.value}px`;
      el.style.padding = px;
      const valDisp = bodyEl.querySelector('#val-el-pad');
      if (valDisp) valDisp.textContent = px;
      Renderer.syncElementChanges(el);
    });

    // 9. Border radius
    const radiusInp = bodyEl.querySelector('#inp-el-radius');
    radiusInp?.addEventListener('input', (e) => {
      const px = `${e.target.value}px`;
      el.style.borderRadius = px;
      const valDisp = bodyEl.querySelector('#val-el-radius');
      if (valDisp) valDisp.textContent = px;
      Renderer.syncElementChanges(el);
    });

    // 10. Image source & upload
    const imgSrcInp = bodyEl.querySelector('#inp-el-img-src');
    imgSrcInp?.addEventListener('input', (e) => {
      el.setAttribute('src', e.target.value);
      Renderer.syncElementChanges(el);
    });

    const imgFileInp = bodyEl.querySelector('#inp-el-img-file');
    imgFileInp?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showToast('Uploading replacement image...', 'info');
        const res = await API.uploadAsset(file);
        el.setAttribute('src', res.url);
        if (imgSrcInp) imgSrcInp.value = res.url;
        Renderer.syncElementChanges(el);
        showToast('Image replaced successfully!', 'success');
      } catch (err) {
        showToast(`Upload failed: ${err.message}`, 'error');
      }
    });

    // 11. Link href
    const hrefInp = bodyEl.querySelector('#inp-el-href');
    hrefInp?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (linkEl) {
        linkEl.setAttribute('data-target-href', val);
        linkEl.setAttribute('href', 'javascript:void(0);');
      } else {
        el.setAttribute('href', val);
      }
      Renderer.syncElementChanges(el);
    });

    // 12. Delete element
    bodyEl.querySelector('#btn-delete-element')?.addEventListener('click', () => {
      if (confirm('Delete this element?')) {
        el.remove();
        Renderer.syncElementChanges(el);
        this.currentElement = null;
        this.renderInspector();
      }
    });

    // 13. Back to section
    bodyEl.querySelector('#btn-back-to-section')?.addEventListener('click', () => {
      if (this.currentElement) {
        this.currentElement.classList.remove('selected-canvas-el');
      }
      this.currentElement = null;
      this.renderInspector();
    });
  },

  renderGlobalSettings(container, project) {
    const theme = project.theme || {};

    container.innerHTML = `
      <div>
        <div class="inspector-group-title">Project Metadata</div>
        <div class="form-group">
          <label class="form-label">Project Name</label>
          <input type="text" class="input-text" id="inp-proj-name" value="${escapeHtmlText(project.name || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="input-textarea" id="inp-proj-desc">${escapeHtmlText(project.description || '')}</textarea>
        </div>
      </div>

      <div>
        <div class="inspector-group-title">Global Theme & Typography</div>
        <div class="form-group">
          <label class="form-label">Primary Brand Color</label>
          <div class="input-color-row">
            <input type="color" class="input-color" id="inp-theme-primary" value="${theme.primaryColor || '#4f46e5'}">
            <input type="text" class="input-text" id="inp-theme-primary-txt" value="${theme.primaryColor || '#4f46e5'}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Page Canvas Background</label>
          <div class="input-color-row">
            <input type="color" class="input-color" id="inp-theme-bg" value="${theme.backgroundColor || '#ffffff'}">
            <input type="text" class="input-text" id="inp-theme-bg-txt" value="${theme.backgroundColor || '#ffffff'}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Base Font Family</label>
          <select class="input-select" id="inp-theme-font">
            <option value="'Inter', sans-serif" ${theme.fontFamily?.includes('Inter') ? 'selected' : ''}>Inter (Modern Sans)</option>
            <option value="'Roboto', sans-serif" ${theme.fontFamily?.includes('Roboto') ? 'selected' : ''}>Roboto</option>
            <option value="'Poppins', sans-serif" ${theme.fontFamily?.includes('Poppins') ? 'selected' : ''}>Poppins</option>
            <option value="system-ui, sans-serif" ${theme.fontFamily?.includes('system-ui') ? 'selected' : ''}>System Default</option>
            <option value="Georgia, serif" ${theme.fontFamily?.includes('Georgia') ? 'selected' : ''}>Georgia</option>
          </select>
        </div>
      </div>
    `;

    const nameInp = container.querySelector('#inp-proj-name');
    nameInp?.addEventListener('input', (e) => {
      State.updateProject(p => { p.name = e.target.value; });
      const topTitle = document.getElementById('project-title-input');
      if (topTitle) topTitle.value = e.target.value;
    });

    const descInp = container.querySelector('#inp-proj-desc');
    descInp?.addEventListener('input', (e) => {
      State.updateProject(p => { p.description = e.target.value; });
    });

    const primaryColor = container.querySelector('#inp-theme-primary');
    const primaryTxt = container.querySelector('#inp-theme-primary-txt');
    primaryColor?.addEventListener('input', (e) => {
      primaryTxt.value = e.target.value;
      State.updateProject(p => { p.theme.primaryColor = e.target.value; });
      Renderer.renderCanvas(State.get('currentProject'), document.getElementById('canvas-device-wrapper'));
    });

    const bgInp = container.querySelector('#inp-theme-bg');
    const bgTxt = container.querySelector('#inp-theme-bg-txt');
    bgInp?.addEventListener('input', (e) => {
      bgTxt.value = e.target.value;
      State.updateProject(p => { p.theme.backgroundColor = e.target.value; });
      Renderer.renderCanvas(State.get('currentProject'), document.getElementById('canvas-device-wrapper'));
    });

    const fontInp = container.querySelector('#inp-theme-font');
    fontInp?.addEventListener('change', (e) => {
      State.updateProject(p => { p.theme.fontFamily = e.target.value; });
      Renderer.renderCanvas(State.get('currentProject'), document.getElementById('canvas-device-wrapper'));
    });
  },

  renderSectionInspector(container, section) {
    const { id, type, props = {}, styles = {} } = section;

    let propsHtml = '';

    if ('heading' in props) {
      propsHtml += `
        <div class="form-group">
          <label class="form-label">Heading Text</label>
          <input type="text" class="input-text inp-prop" data-prop="heading" value="${escapeHtmlText(props.heading || '')}">
        </div>`;
    }

    if ('subheading' in props) {
      propsHtml += `
        <div class="form-group">
          <label class="form-label">Subheading</label>
          <textarea class="input-textarea inp-prop" data-prop="subheading">${escapeHtmlText(props.subheading || '')}</textarea>
        </div>`;
    }

    if ('badge' in props) {
      propsHtml += `
        <div class="form-group">
          <label class="form-label">Badge Pill Text</label>
          <input type="text" class="input-text inp-prop" data-prop="badge" value="${escapeHtmlText(props.badge || '')}">
        </div>`;
    }

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <span class="badge">${type}</span>
        <button class="btn btn-danger btn-sm" id="btn-delete-section">Delete Section</button>
      </div>

      <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:14px;">
        Click any specific heading, paragraph, button, or image on the canvas to inspect and edit its font, colors, and text.
      </p>

      ${propsHtml ? `
      <div>
        <div class="inspector-group-title">Section Content</div>
        ${propsHtml}
      </div>` : ''}

      <div>
        <div class="inspector-group-title">Section Spacing & Canvas</div>
        <div class="form-group">
          <label class="form-label">Top Padding (${styles.paddingTop || 0}px)</label>
          <div class="input-range-row">
            <input type="range" class="input-range inp-style" data-style="paddingTop" min="0" max="200" step="5" value="${styles.paddingTop || 0}">
            <span class="range-val">${styles.paddingTop || 0}px</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Bottom Padding (${styles.paddingBottom || 0}px)</label>
          <div class="input-range-row">
            <input type="range" class="input-range inp-style" data-style="paddingBottom" min="0" max="200" step="5" value="${styles.paddingBottom || 0}">
            <span class="range-val">${styles.paddingBottom || 0}px</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Background Color</label>
          <div class="input-color-row">
            <input type="color" class="input-color inp-style" data-style="backgroundColor" value="${styles.backgroundColor && styles.backgroundColor.startsWith('#') ? styles.backgroundColor : '#ffffff'}">
            <input type="text" class="input-text inp-style-txt" data-style="backgroundColor" value="${styles.backgroundColor || '#ffffff'}">
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.inp-prop').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const propKey = inp.getAttribute('data-prop');
        const val = e.target.value;
        State.updateProject(p => {
          const sec = p.sections.find(s => s.id === id);
          if (sec && sec.props) sec.props[propKey] = val;
        });
        Renderer.renderCanvas(State.get('currentProject'), document.getElementById('canvas-device-wrapper'));
      });
    });

    container.querySelectorAll('.inp-style').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const styleKey = inp.getAttribute('data-style');
        const val = e.target.value;
        const valDisplay = inp.closest('.form-group')?.querySelector('.range-val');
        if (valDisplay) valDisplay.textContent = `${val}px`;

        State.updateProject(p => {
          const sec = p.sections.find(s => s.id === id);
          if (sec && sec.styles) sec.styles[styleKey] = styleKey.includes('padding') ? parseInt(val, 10) : val;
        });
        Renderer.renderCanvas(State.get('currentProject'), document.getElementById('canvas-device-wrapper'));
      });
    });

    container.querySelector('#btn-delete-section')?.addEventListener('click', () => {
      if (confirm('Delete this section?')) {
        Renderer.handleSectionAction('delete', id);
      }
    });
  }
};

window.Inspector = Inspector;

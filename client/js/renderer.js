/**
 * ReverseBuilder Live Canvas Renderer
 * Supports modular component sections as well as authentic reconstructed webpage sections.
 * Provides deep element-level inspection, live inline text editing, and real-time styling.
 */
const Renderer = {
  selectedElement: null,

  renderCanvas(project, containerElement) {
    if (!containerElement) return;

    if (!project || !Array.isArray(project.sections) || project.sections.length === 0) {
      containerElement.innerHTML = `
        <div class="canvas-empty">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
          <h3>Canvas is Empty</h3>
          <p style="margin-top: 0.5rem; color: #64748b;">Add a section from the Components sidebar or import a website from a URL.</p>
        </div>`;
      return;
    }

    const theme = project.theme || {};
    const selectedSectionId = State.get('selectedSectionId');
    const isPreview = State.get('isPreviewMode');

    // Apply project theme styles to container
    containerElement.style.setProperty('--color-primary', theme.primaryColor || '#4f46e5');
    containerElement.style.setProperty('--color-secondary', theme.secondaryColor || '#06b6d4');
    containerElement.style.setProperty('--color-bg', theme.backgroundColor || '#ffffff');
    containerElement.style.setProperty('--color-text', theme.textColor || '#0f172a');
    containerElement.style.setProperty('--font-family', theme.fontFamily || "'Inter', sans-serif");
    containerElement.style.backgroundColor = theme.backgroundColor || '#ffffff';
    containerElement.style.fontFamily = theme.fontFamily || "'Inter', sans-serif";

    // Toggle editor mode class
    if (isPreview) {
      containerElement.classList.remove('editor-active-mode');
    } else {
      containerElement.classList.add('editor-active-mode');
    }

    // Dynamic style tags for external and inline styles of the crawled site
    let stylesInjection = '';
    if (Array.isArray(project.stylesheets) && project.stylesheets.length > 0) {
      stylesInjection += project.stylesheets.map(url => `<link rel="stylesheet" href="${url}">`).join('\n');
    }
    if (Array.isArray(project.inlineStyles) && project.inlineStyles.length > 0) {
      stylesInjection += `<style>\n${project.inlineStyles.join('\n')}\n</style>`;
    }

    // Global Capture-Phase Event Interceptors (Strictly block navigation in Edit Mode)
    if (!containerElement._hasGlobalClickInterceptor) {
      containerElement._hasGlobalClickInterceptor = true;

      // In capture phase, intercept click BEFORE any child or anchor tag receives it
      containerElement.addEventListener('click', (e) => {
        if (!State.get('isPreviewMode')) {
          if (e.target.closest('.canvas-section-actions')) return;
          // Prevent browser from navigating or following links
          e.preventDefault();
        }
      }, true);

      containerElement.addEventListener('submit', (e) => {
        if (!State.get('isPreviewMode')) {
          e.preventDefault();
          return false;
        }
      }, true);
    }

    // Build markup for all sections
    const htmlChunks = [];
    if (stylesInjection) {
      htmlChunks.push(`<div id="crawled-styles-container">${stylesInjection}</div>`);
    }

    project.sections.forEach((section) => {
      const isSelected = section.id === selectedSectionId;
      const sectionMarkup = this.renderSectionHtml(section);

      const sectionWrapper = `
        <div class="canvas-section ${isSelected ? 'selected' : ''}" data-section-id="${section.id}">
          ${!isPreview ? `
          <div class="canvas-section-actions">
            <span class="canvas-action-pill" data-action="move-up" data-id="${section.id}" title="Move Up">▲</span>
            <span class="canvas-action-pill" data-action="move-down" data-id="${section.id}" title="Move Down">▼</span>
            <span class="canvas-action-pill" data-action="duplicate" data-id="${section.id}" title="Duplicate">📋</span>
            <span class="canvas-action-pill" data-action="delete" data-id="${section.id}" style="color:#ef4444;" title="Delete Section">🗑️</span>
          </div>` : ''}

          ${sectionMarkup}
        </div>
      `;

      htmlChunks.push(sectionWrapper);
    });

    containerElement.innerHTML = htmlChunks.join('\n');
    this.bindCanvasEvents(containerElement);
  },

  renderSectionHtml(section) {
    const { id, type, props = {}, styles = {} } = section;
    const inlineStyle = `padding-top: ${styles.paddingTop || 0}px; padding-bottom: ${styles.paddingBottom || 0}px; background-color: ${styles.backgroundColor || 'transparent'}; color: ${styles.textColor || 'inherit'}; text-align: ${styles.textAlign || 'left'};`;
    const containerStyle = `max-width: ${styles.maxWidth || 1400}px; margin-left: auto; margin-right: auto; padding-left: 20px; padding-right: 20px;`;

    // 1. Raw HTML section (Directly from crawled website)
    if (type === 'raw-html') {
      const content = props.html || '';
      return `
        <div class="raw-html-wrapper" style="${inlineStyle}">
          <div class="raw-html-container">
            ${content}
          </div>
        </div>`;
    }

    // 2. Standard Pre-built Modular Components
    switch (type) {
      case 'navbar': {
        const links = (props.links || []).map(link => 
          `<li><a href="${link.href || '#'}" class="nav-link">${link.label || 'Link'}</a></li>`
        ).join('\n');

        return `
          <header class="section-navbar" style="${inlineStyle}">
            <div class="nav-container" style="${containerStyle}">
              <a href="#" class="brand-logo" data-prop="brandName">${props.brandName || 'ReverseBuilder'}</a>
              <nav class="nav-menu">
                <ul class="nav-list">${links}</ul>
                <a href="${props.ctaHref || '#cta'}" class="btn btn-primary nav-cta" data-prop="ctaText">${props.ctaText || 'Get Started'}</a>
              </nav>
            </div>
          </header>`;
      }

      case 'hero': {
        return `
          <section class="section-hero" style="${inlineStyle}">
            <div class="hero-container" style="${containerStyle}">
              <div class="hero-content">
                ${props.badge ? `<div class="badge" data-prop="badge">${props.badge}</div>` : ''}
                <h1 class="hero-heading" data-prop="heading">${props.heading || 'Build Something Great'}</h1>
                <p class="hero-subheading" data-prop="subheading">${props.subheading || 'A customizable modern hero section'}</p>
                <div class="hero-actions">
                  <a href="${props.primaryButtonHref || '#features'}" class="btn btn-primary" data-prop="primaryButtonText">${props.primaryButtonText || 'Get Started'}</a>
                  ${props.secondaryButtonText ? `<a href="${props.secondaryButtonHref || '#demo'}" class="btn btn-secondary" data-prop="secondaryButtonText">${props.secondaryButtonText}</a>` : ''}
                </div>
              </div>
              ${props.imageUrl ? `
              <div class="hero-image-wrapper">
                <img src="${props.imageUrl}" alt="${props.imageAlt || 'Hero'}" class="hero-img">
              </div>` : ''}
            </div>
          </section>`;
      }

      case 'features': {
        const items = (props.items || []).map((item, idx) => `
          <div class="feature-card">
            <div class="feature-icon">${item.icon || '✦'}</div>
            <h3 class="feature-title" data-item-idx="${idx}" data-item-prop="title">${item.title || 'Feature'}</h3>
            <p class="feature-desc" data-item-idx="${idx}" data-item-prop="description">${item.description || 'Description'}</p>
          </div>`).join('\n');

        return `
          <section class="section-features" style="${inlineStyle}">
            <div style="${containerStyle}">
              <div class="section-header">
                ${props.badge ? `<div class="badge" data-prop="badge">${props.badge}</div>` : ''}
                <h2 class="section-heading" data-prop="heading">${props.heading || 'Features'}</h2>
                ${props.description ? `<p class="section-description" data-prop="description">${props.description}</p>` : ''}
              </div>
              <div class="features-grid">${items}</div>
            </div>
          </section>`;
      }

      case 'stats': {
        const items = (props.items || []).map((item, idx) => `
          <div class="stat-item">
            <div class="stat-value" data-item-idx="${idx}" data-item-prop="value">${item.value || '0'}</div>
            <div class="stat-label" data-item-idx="${idx}" data-item-prop="label">${item.label || 'Metric'}</div>
          </div>`).join('\n');

        return `
          <section class="section-stats" style="${inlineStyle}">
            <div style="${containerStyle}">
              ${props.heading ? `<h2 class="section-heading text-center" data-prop="heading">${props.heading}</h2>` : ''}
              <div class="stats-grid">${items}</div>
            </div>
          </section>`;
      }

      case 'testimonials': {
        const items = (props.items || []).map((item, idx) => `
          <div class="testimonial-card">
            <div class="stars">★★★★★</div>
            <blockquote class="testimonial-quote" data-item-idx="${idx}" data-item-prop="quote">"${item.quote || 'Great platform!'}"</blockquote>
            <div class="testimonial-author">
              ${item.avatar ? `<img src="${item.avatar}" alt="${item.author || 'Author'}" class="author-avatar">` : ''}
              <div>
                <div class="author-name" data-item-idx="${idx}" data-item-prop="author">${item.author || 'Author Name'}</div>
                <div class="author-role" data-item-idx="${idx}" data-item-prop="role">${item.role || 'Role'}</div>
              </div>
            </div>
          </div>`).join('\n');

        return `
          <section class="section-testimonials" style="${inlineStyle}">
            <div style="${containerStyle}">
              <div class="section-header">
                ${props.badge ? `<div class="badge" data-prop="badge">${props.badge}</div>` : ''}
                <h2 class="section-heading" data-prop="heading">${props.heading || 'Testimonials'}</h2>
                ${props.description ? `<p class="section-description" data-prop="description">${props.description}</p>` : ''}
              </div>
              <div class="testimonials-grid">${items}</div>
            </div>
          </section>`;
      }

      case 'pricing': {
        const items = (props.items || []).map((tier, idx) => {
          const isPop = tier.isPopular ? 'popular' : '';
          const features = (tier.features || []).map(f => `<li>✓ ${f}</li>`).join('\n');
          return `
            <div class="pricing-card ${isPop}">
              ${tier.isPopular ? '<div class="popular-badge">Most Popular</div>' : ''}
              <h3 class="tier-name" data-item-idx="${idx}" data-item-prop="name">${tier.name || 'Tier'}</h3>
              <div class="tier-price">
                <span class="price-value" data-item-idx="${idx}" data-item-prop="price">${tier.price || '$0'}</span>
                <span class="price-period" data-item-idx="${idx}" data-item-prop="period">${tier.period || '/mo'}</span>
              </div>
              <p class="tier-desc" data-item-idx="${idx}" data-item-prop="description">${tier.description || ''}</p>
              <ul class="tier-features">${features}</ul>
              <a href="#contact" class="btn ${tier.isPopular ? 'btn-primary' : 'btn-outline'}">${tier.ctaText || 'Get Started'}</a>
            </div>`;
        }).join('\n');

        return `
          <section class="section-pricing" style="${inlineStyle}">
            <div style="${containerStyle}">
              <div class="section-header">
                ${props.badge ? `<div class="badge" data-prop="badge">${props.badge}</div>` : ''}
                <h2 class="section-heading" data-prop="heading">${props.heading || 'Pricing Plans'}</h2>
                ${props.description ? `<p class="section-description" data-prop="description">${props.description}</p>` : ''}
              </div>
              <div class="pricing-grid">${items}</div>
            </div>
          </section>`;
      }

      case 'contact': {
        return `
          <section class="section-contact" style="${inlineStyle}">
            <div style="${containerStyle}">
              <div class="section-header">
                ${props.badge ? `<div class="badge" data-prop="badge">${props.badge}</div>` : ''}
                <h2 class="section-heading" data-prop="heading">${props.heading || 'Contact Us'}</h2>
                ${props.description ? `<p class="section-description" data-prop="description">${props.description}</p>` : ''}
              </div>
              <form class="contact-form" onsubmit="event.preventDefault(); alert('Message sent (demo preview)');">
                <div class="form-row">
                  <div class="form-group"><label>Your Name</label><input type="text" placeholder="Alex Mercer"></div>
                  <div class="form-group"><label>Email Address</label><input type="email" placeholder="alex@example.com"></div>
                </div>
                <div class="form-group"><label>Message</label><textarea rows="4" placeholder="How can we help?"></textarea></div>
                <button type="submit" class="btn btn-primary" data-prop="buttonText">${props.buttonText || 'Send Message'}</button>
              </form>
            </div>
          </section>`;
      }

      case 'cta': {
        return `
          <section class="section-cta" style="${inlineStyle}">
            <div style="${containerStyle}">
              <h2 class="cta-heading" data-prop="heading">${props.heading || 'Ready to Get Started?'}</h2>
              ${props.description ? `<p class="cta-description" data-prop="description">${props.description}</p>` : ''}
              <div class="cta-actions">
                <a href="${props.buttonHref || '#pricing'}" class="btn btn-cta" data-prop="buttonText">${props.buttonText || 'Start Now'}</a>
              </div>
            </div>
          </section>`;
      }

      case 'footer': {
        return `
          <footer class="section-footer" style="${inlineStyle}">
            <div style="${containerStyle}">
              <div class="footer-grid">
                <div class="footer-brand">
                  <div class="brand-logo" data-prop="brandName">${props.brandName || 'ReverseBuilder'}</div>
                  <p class="brand-desc" data-prop="description">${props.description || 'Modern web artisan platform.'}</p>
                </div>
              </div>
              <div class="footer-bottom">
                <p data-prop="copyright">${props.copyright || '© 2026 All rights reserved.'}</p>
              </div>
            </div>
          </footer>`;
      }

      case 'image-block': {
        return `
          <section class="section-image" style="${inlineStyle}">
            <div style="${containerStyle}">
              <figure class="image-wrapper">
                <img src="${props.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'}" alt="${props.alt || 'Visual'}" class="responsive-img">
                ${props.caption ? `<figcaption class="image-caption" data-prop="caption">${props.caption}</figcaption>` : ''}
              </figure>
            </div>
          </section>`;
      }

      case 'text-block':
      default: {
        return `
          <section class="section-text" style="${inlineStyle}">
            <div style="${containerStyle}">
              ${props.heading ? `<h2 class="section-heading" data-prop="heading">${props.heading}</h2>` : ''}
              <div class="text-content">
                <p data-prop="content">${props.content || 'Content block'}</p>
              </div>
            </div>
          </section>`;
      }
    }
  },

  bindCanvasEvents(container) {
    if (State.get('isPreviewMode')) return;

    // 1. Tag all interactive elements inside canvas for easy hovering and editing
    const interactiveTags = 'h1, h2, h3, h4, h5, h6, p, a, button, span, img, li, label, strong, em, b, i, blockquote, figcaption, input, textarea, div.feature-card, div.pricing-card, div.testimonial-card, div.stat-item';

    container.querySelectorAll(interactiveTags).forEach(el => {
      // Skip actions toolbar buttons
      if (el.closest('.canvas-section-actions')) return;

      el.setAttribute('data-editable-el', 'true');

      // Click to select specific element
      el.addEventListener('click', (e) => {
        e.stopPropagation();

        // Remove previous element selection
        container.querySelectorAll('.selected-canvas-el').forEach(prev => prev.classList.remove('selected-canvas-el'));

        // Select this element
        el.classList.add('selected-canvas-el');
        this.selectedElement = el;

        const secEl = el.closest('.canvas-section');
        const secId = secEl ? secEl.getAttribute('data-section-id') : null;

        State.set('selectedSectionId', secId);
        State.set('selectedElement', el);

        if (window.Inspector) {
          window.Inspector.renderElementInspector(el, secId);
        }
      });

      // Double-click to inline edit text directly
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (el.tagName.toLowerCase() === 'img') return;

        el.contentEditable = 'true';
        el.focus();
        el.style.outline = '2px solid var(--primary)';
        el.style.cursor = 'text';

        const finishEditing = () => {
          el.contentEditable = 'false';
          el.style.outline = '';
          el.style.cursor = '';
          this.syncElementChanges(el);
        };

        el.onblur = finishEditing;
        el.onkeydown = (k) => {
          if (k.key === 'Enter' && !k.shiftKey && ['h1','h2','h3','h4','h5','h6','button','a','span'].includes(el.tagName.toLowerCase())) {
            k.preventDefault();
            el.blur();
          }
        };
      });
    });

    // 2. Click section background (when not clicking a child element)
    container.querySelectorAll('.canvas-section').forEach(secEl => {
      secEl.addEventListener('click', (e) => {
        if (e.target.closest('.canvas-section-actions')) return;

        // Deselect specific element
        container.querySelectorAll('.selected-canvas-el').forEach(prev => prev.classList.remove('selected-canvas-el'));
        this.selectedElement = null;
        State.set('selectedElement', null);

        const secId = secEl.getAttribute('data-section-id');
        State.set('selectedSectionId', secId);

        if (window.Inspector) {
          window.Inspector.renderInspector();
        }
      });
    });

    // 3. Section Action Buttons (Move Up, Move Down, Duplicate, Delete)
    container.querySelectorAll('.canvas-action-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        this.handleSectionAction(action, id);
      });
    });
  },

  /**
   * Syncs changes made to an element back to the section's HTML in State.currentProject
   */
  syncElementChanges(el) {
    const secEl = el.closest('.canvas-section');
    if (!secEl) return;
    const secId = secEl.getAttribute('data-section-id');
    if (!secId) return;

    State.updateProject(project => {
      const sec = project.sections.find(s => s.id === secId);
      if (!sec) return;

      if (sec.type === 'raw-html') {
        const wrapper = secEl.querySelector('.raw-html-wrapper > div');
        if (wrapper) {
          // Clone and clean temporary editor attributes
          const clone = wrapper.cloneNode(true);
          clone.querySelectorAll('.selected-canvas-el').forEach(c => c.classList.remove('selected-canvas-el'));
          clone.querySelectorAll('[data-editable-el]').forEach(c => c.removeAttribute('data-editable-el'));
          sec.props.html = clone.innerHTML;
        }
      } else {
        // If it's a prop-based component
        const prop = el.getAttribute('data-prop');
        if (prop && sec.props) {
          sec.props[prop] = el.innerText.trim();
        }
      }
    });

    // Re-render Inspector text field
    if (window.Inspector && window.Inspector.currentElement === el) {
      window.Inspector.updateTextField(el.innerText || el.textContent || '');
    }
  },

  handleSectionAction(action, sectionId) {
    State.updateProject(project => {
      const idx = project.sections.findIndex(s => s.id === sectionId);
      if (idx === -1) return;

      if (action === 'move-up' && idx > 0) {
        const item = project.sections.splice(idx, 1)[0];
        project.sections.splice(idx - 1, 0, item);
      } else if (action === 'move-down' && idx < project.sections.length - 1) {
        const item = project.sections.splice(idx, 1)[0];
        project.sections.splice(idx + 1, 0, item);
      } else if (action === 'duplicate') {
        const source = project.sections[idx];
        const copy = JSON.parse(JSON.stringify(source));
        copy.id = `${source.type}-${Math.random().toString(36).slice(2, 8)}`;
        copy.name = `${source.name} (Copy)`;
        project.sections.splice(idx + 1, 0, copy);
        State.set('selectedSectionId', copy.id);
      } else if (action === 'delete') {
        project.sections.splice(idx, 1);
        if (State.get('selectedSectionId') === sectionId) {
          State.set('selectedSectionId', null);
        }
      }
    });

    this.renderCanvas(State.get('currentProject'), document.getElementById('canvas-device-wrapper'));
    if (window.Inspector) {
      window.Inspector.renderInspector();
    }
  }
};

window.Renderer = Renderer;

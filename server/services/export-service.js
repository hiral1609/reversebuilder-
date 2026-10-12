const JSZip = require('jszip');
const { escapeHtml } = require('../validators/schema-validator');

class ExportService {
  /**
   * Generates HTML markup for a single section
   */
  generateSectionHtml(section, theme) {
    const { id, type, props = {}, styles = {} } = section;
    const inlineStyle = `padding-top: ${styles.paddingTop || 0}px; padding-bottom: ${styles.paddingBottom || 0}px; background-color: ${styles.backgroundColor || 'transparent'}; color: ${styles.textColor || 'inherit'}; text-align: ${styles.textAlign || 'left'};`;
    const containerStyle = `max-width: ${styles.maxWidth || 1400}px; margin-left: auto; margin-right: auto; padding-left: 20px; padding-right: 20px;`;

    switch (type) {
      case 'raw-html': {
        let rawContent = props.html || '';
        // Restore neutralized data-target-href back to standard href for clean export
        rawContent = rawContent.replace(/data-target-href="([^"]+)"\s+href="javascript:void\(0\);"/gi, 'href="$1"');
        rawContent = rawContent.replace(/href="javascript:void\(0\);"\s+data-target-href="([^"]+)"/gi, 'href="$1"');
        rawContent = rawContent.replace(/href="javascript:void\(0\);"/gi, 'href="#"');
        return `
  <section id="${id}" class="section-raw-html" style="${inlineStyle}">
    <div style="${containerStyle}">
      ${rawContent}
    </div>
  </section>`;
      }

      case 'navbar': {
        const brandName = escapeHtml(props.brandName || 'ReverseBuilder');
        const links = Array.isArray(props.links) ? props.links : [];
        const ctaText = escapeHtml(props.ctaText || 'Get Started');
        const ctaHref = escapeHtml(props.ctaHref || '#cta');

        const navLinksHtml = links.map(link => 
          `<li><a href="${escapeHtml(link.href || '#')}" class="nav-link">${escapeHtml(link.label || 'Link')}</a></li>`
        ).join('\n        ');

        return `
  <header id="${id}" class="section-navbar" style="${inlineStyle}">
    <div class="nav-container" style="${containerStyle}">
      <a href="#" class="brand-logo">${brandName}</a>
      <button class="mobile-toggle" aria-label="Toggle Navigation" aria-expanded="false">
        <span class="bar"></span><span class="bar"></span><span class="bar"></span>
      </button>
      <nav class="nav-menu">
        <ul class="nav-list">
          ${navLinksHtml}
        </ul>
        <a href="${ctaHref}" class="btn btn-primary nav-cta">${ctaText}</a>
      </nav>
    </div>
  </header>`;
      }

      case 'hero': {
        const badge = props.badge ? `<div class="badge">${escapeHtml(props.badge)}</div>` : '';
        const heading = escapeHtml(props.heading || 'Build Something Great');
        const subheading = escapeHtml(props.subheading || 'A customizable modern hero section');
        const primaryText = escapeHtml(props.primaryButtonText || 'Get Started');
        const primaryHref = escapeHtml(props.primaryButtonHref || '#features');
        const secondaryText = props.secondaryButtonText ? escapeHtml(props.secondaryButtonText) : '';
        const secondaryHref = props.secondaryButtonHref ? escapeHtml(props.secondaryButtonHref) : '#demo';
        const imageUrl = props.imageUrl ? escapeHtml(props.imageUrl) : '';
        const imageAlt = escapeHtml(props.imageAlt || 'Hero Image');

        const secondaryBtnHtml = secondaryText ? `<a href="${secondaryHref}" class="btn btn-secondary">${secondaryText}</a>` : '';
        const imageHtml = imageUrl ? `
        <div class="hero-image-wrapper">
          <img src="${imageUrl}" alt="${imageAlt}" loading="lazy" class="hero-img">
        </div>` : '';

        return `
  <section id="${id}" class="section-hero" style="${inlineStyle}">
    <div class="hero-container" style="${containerStyle}">
      <div class="hero-content">
        ${badge}
        <h1 class="hero-heading">${heading}</h1>
        <p class="hero-subheading">${subheading}</p>
        <div class="hero-actions">
          <a href="${primaryHref}" class="btn btn-primary">${primaryText}</a>
          ${secondaryBtnHtml}
        </div>
      </div>
      ${imageHtml}
    </div>
  </section>`;
      }

      case 'features': {
        const badge = props.badge ? `<div class="badge">${escapeHtml(props.badge)}</div>` : '';
        const heading = escapeHtml(props.heading || 'Features');
        const description = props.description ? `<p class="section-description">${escapeHtml(props.description)}</p>` : '';
        const items = Array.isArray(props.items) ? props.items : [];

        const itemsHtml = items.map(item => `
        <div class="feature-card">
          <div class="feature-icon">${escapeHtml(item.icon || '✦')}</div>
          <h3 class="feature-title">${escapeHtml(item.title || 'Feature Title')}</h3>
          <p class="feature-desc">${escapeHtml(item.description || 'Feature description')}</p>
        </div>`).join('\n');

        return `
  <section id="${id}" class="section-features" style="${inlineStyle}">
    <div style="${containerStyle}">
      <div class="section-header">
        ${badge}
        <h2 class="section-heading">${heading}</h2>
        ${description}
      </div>
      <div class="features-grid">
        ${itemsHtml}
      </div>
    </div>
  </section>`;
      }

      case 'stats': {
        const heading = props.heading ? `<h2 class="section-heading text-center">${escapeHtml(props.heading)}</h2>` : '';
        const items = Array.isArray(props.items) ? props.items : [];

        const itemsHtml = items.map(item => `
        <div class="stat-item">
          <div class="stat-value">${escapeHtml(item.value || '0')}</div>
          <div class="stat-label">${escapeHtml(item.label || 'Metric')}</div>
        </div>`).join('\n');

        return `
  <section id="${id}" class="section-stats" style="${inlineStyle}">
    <div style="${containerStyle}">
      ${heading}
      <div class="stats-grid">
        ${itemsHtml}
      </div>
    </div>
  </section>`;
      }

      case 'testimonials': {
        const badge = props.badge ? `<div class="badge">${escapeHtml(props.badge)}</div>` : '';
        const heading = escapeHtml(props.heading || 'Testimonials');
        const description = props.description ? `<p class="section-description">${escapeHtml(props.description)}</p>` : '';
        const items = Array.isArray(props.items) ? props.items : [];

        const itemsHtml = items.map(item => `
        <div class="testimonial-card">
          <div class="stars">★★★★★</div>
          <blockquote class="testimonial-quote">"${escapeHtml(item.quote || 'Outstanding experience!')}"</blockquote>
          <div class="testimonial-author">
            ${item.avatar ? `<img src="${escapeHtml(item.avatar)}" alt="${escapeHtml(item.author || 'Author')}" class="author-avatar">` : ''}
            <div>
              <div class="author-name">${escapeHtml(item.author || 'Happy Customer')}</div>
              <div class="author-role">${escapeHtml(item.role || 'Verified User')}</div>
            </div>
          </div>
        </div>`).join('\n');

        return `
  <section id="${id}" class="section-testimonials" style="${inlineStyle}">
    <div style="${containerStyle}">
      <div class="section-header">
        ${badge}
        <h2 class="section-heading">${heading}</h2>
        ${description}
      </div>
      <div class="testimonials-grid">
        ${itemsHtml}
      </div>
    </div>
  </section>`;
      }

      case 'pricing': {
        const badge = props.badge ? `<div class="badge">${escapeHtml(props.badge)}</div>` : '';
        const heading = escapeHtml(props.heading || 'Pricing');
        const description = props.description ? `<p class="section-description">${escapeHtml(props.description)}</p>` : '';
        const items = Array.isArray(props.items) ? props.items : [];

        const itemsHtml = items.map(tier => {
          const isPop = tier.isPopular ? 'popular' : '';
          const popBadge = tier.isPopular ? '<div class="popular-badge">Most Popular</div>' : '';
          const featuresList = (tier.features || []).map(f => `<li>✓ ${escapeHtml(f)}</li>`).join('\n            ');

          return `
        <div class="pricing-card ${isPop}">
          ${popBadge}
          <h3 class="tier-name">${escapeHtml(tier.name || 'Tier')}</h3>
          <div class="tier-price">
            <span class="price-value">${escapeHtml(tier.price || '$0')}</span>
            <span class="price-period">${escapeHtml(tier.period || '/mo')}</span>
          </div>
          <p class="tier-desc">${escapeHtml(tier.description || '')}</p>
          <ul class="tier-features">
            ${featuresList}
          </ul>
          <a href="#contact" class="btn ${tier.isPopular ? 'btn-primary' : 'btn-outline'}">${escapeHtml(tier.ctaText || 'Get Started')}</a>
        </div>`;
        }).join('\n');

        return `
  <section id="${id}" class="section-pricing" style="${inlineStyle}">
    <div style="${containerStyle}">
      <div class="section-header">
        ${badge}
        <h2 class="section-heading">${heading}</h2>
        ${description}
      </div>
      <div class="pricing-grid">
        ${itemsHtml}
      </div>
    </div>
  </section>`;
      }

      case 'contact': {
        const badge = props.badge ? `<div class="badge">${escapeHtml(props.badge)}</div>` : '';
        const heading = escapeHtml(props.heading || 'Contact Us');
        const description = props.description ? `<p class="section-description">${escapeHtml(props.description)}</p>` : '';
        const buttonText = escapeHtml(props.buttonText || 'Send Message');

        return `
  <section id="${id}" class="section-contact" style="${inlineStyle}">
    <div style="${containerStyle}">
      <div class="section-header">
        ${badge}
        <h2 class="section-heading">${heading}</h2>
        ${description}
      </div>
      <form class="contact-form" id="form-${id}">
        <div class="form-row">
          <div class="form-group">
            <label for="name-${id}">Your Name</label>
            <input type="text" id="name-${id}" name="name" required placeholder="Alex Mercer">
          </div>
          <div class="form-group">
            <label for="email-${id}">Email Address</label>
            <input type="email" id="email-${id}" name="email" required placeholder="alex@example.com">
          </div>
        </div>
        <div class="form-group">
          <label for="message-${id}">Message</label>
          <textarea id="message-${id}" name="message" rows="5" required placeholder="How can we help you?"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">${buttonText}</button>
        <div class="form-feedback" id="feedback-${id}" style="display:none;"></div>
      </form>
    </div>
  </section>`;
      }

      case 'cta': {
        const heading = escapeHtml(props.heading || 'Ready to Get Started?');
        const description = props.description ? `<p class="cta-description">${escapeHtml(props.description)}</p>` : '';
        const btnText = escapeHtml(props.buttonText || 'Start Now');
        const btnHref = escapeHtml(props.buttonHref || '#pricing');

        return `
  <section id="${id}" class="section-cta" style="${inlineStyle}">
    <div style="${containerStyle}">
      <h2 class="cta-heading">${heading}</h2>
      ${description}
      <div class="cta-actions">
        <a href="${btnHref}" class="btn btn-cta">${btnText}</a>
      </div>
    </div>
  </section>`;
      }

      case 'footer': {
        const brandName = escapeHtml(props.brandName || 'ReverseBuilder');
        const description = escapeHtml(props.description || 'Crafting modern websites.');
        const copyright = escapeHtml(props.copyright || '© 2026 All rights reserved.');
        const columns = Array.isArray(props.columns) ? props.columns : [];

        const colsHtml = columns.map(col => {
          const linksHtml = (col.links || []).map(link => 
            `<li><a href="${escapeHtml(link.href || '#')}">${escapeHtml(link.label || 'Link')}</a></li>`
          ).join('\n              ');
          return `
          <div class="footer-col">
            <h4 class="footer-title">${escapeHtml(col.title || 'Links')}</h4>
            <ul class="footer-links">
              ${linksHtml}
            </ul>
          </div>`;
        }).join('\n');

        return `
  <footer id="${id}" class="section-footer" style="${inlineStyle}">
    <div style="${containerStyle}">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="brand-logo">${brandName}</div>
          <p class="brand-desc">${description}</p>
        </div>
        ${colsHtml}
      </div>
      <div class="footer-bottom">
        <p>${copyright}</p>
      </div>
    </div>
  </footer>`;
      }

      case 'image-block': {
        const imageUrl = escapeHtml(props.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80');
        const alt = escapeHtml(props.alt || 'Visual showcase');
        const caption = props.caption ? `<figcaption class="image-caption">${escapeHtml(props.caption)}</figcaption>` : '';

        return `
  <section id="${id}" class="section-image" style="${inlineStyle}">
    <div style="${containerStyle}">
      <figure class="image-wrapper">
        <img src="${imageUrl}" alt="${alt}" loading="lazy" class="responsive-img">
        ${caption}
      </figure>
    </div>
  </section>`;
      }

      case 'text-block':
      default: {
        const heading = props.heading ? `<h2 class="section-heading">${escapeHtml(props.heading)}</h2>` : '';
        const content = escapeHtml(props.content || 'Content block');

        return `
  <section id="${id}" class="section-text" style="${inlineStyle}">
    <div style="${containerStyle}">
      ${heading}
      <div class="text-content">
        <p>${content}</p>
      </div>
    </div>
  </section>`;
      }
    }
  }

  /**
   * Generates the entire index.html
   */
  generateIndexHtml(project) {
    const title = escapeHtml(project.name || 'Exported Website');
    const description = escapeHtml(project.description || 'Generated with ReverseBuilder');
    const theme = project.theme || {};
    const sections = Array.isArray(project.sections) ? project.sections : [];

    const sectionsHtml = sections.map(sec => this.generateSectionHtml(sec, theme)).join('\n');

    // External stylesheets & inline styles from original crawled page
    const extStylesHtml = (project.stylesheets || [])
      .map(url => `  <link rel="stylesheet" href="${escapeHtml(url)}">`)
      .join('\n');

    const inlineStylesHtml = (project.inlineStyles || [])
      .map(css => `  <style>\n${css}\n  </style>`)
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
${extStylesHtml ? extStylesHtml + '\n' : ''}${inlineStylesHtml ? inlineStylesHtml + '\n' : ''}  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main>
${sectionsHtml}
  </main>
  <script src="script.js"></script>
</body>
</html>`;
  }

  /**
   * Generates production-ready, clean styles.css
   */
  generateStylesCss(project) {
    const theme = project.theme || {};
    const primary = theme.primaryColor || '#4f46e5';
    const secondary = theme.secondaryColor || '#06b6d4';
    const bg = theme.backgroundColor || '#ffffff';
    const text = theme.textColor || '#0f172a';
    const fontFamily = theme.fontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

    return `/* ==========================================================================
   Generated by ReverseBuilder
   Theme Settings & Base Variables
   ========================================================================== */
:root {
  --color-primary: ${primary};
  --color-primary-hover: #3730a3;
  --color-secondary: ${secondary};
  --color-bg: ${bg};
  --color-text: ${text};
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-card-bg: #ffffff;
  --color-surface-subtle: #f8fafc;
  --font-family: ${fontFamily};
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Base Body Styles */
body {
  font-family: var(--font-family);
  background-color: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

img {
  max-width: 100%;
  height: auto;
}

/* Raw HTML Section Containers */
.section-raw-html {
  width: 100%;
  position: relative;
}

/* Base Components & Buttons */
.badge {
  display: inline-block;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 9999px;
  background-color: rgba(79, 70, 229, 0.1);
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition);
  text-align: center;
  text-decoration: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: #ffffff;
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-text);
  border-color: var(--color-border);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* Section Header Styles */
.section-header {
  text-align: center;
  margin-bottom: 3.5rem;
  max-width: 760px;
  margin-left: auto;
  margin-right: auto;
}

.section-heading {
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.25;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.section-description {
  font-size: 1.15rem;
  color: var(--color-text-muted);
}

/* Navbar */
.section-navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-text);
  text-decoration: none;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-list {
  display: flex;
  gap: 1.5rem;
  list-style: none;
}

.nav-link {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
}

.mobile-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
}

/* Hero */
.hero-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 3.5rem;
}

.hero-heading {
  font-size: 3.25rem;
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 1.25rem;
}

.hero-subheading {
  font-size: 1.25rem;
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.hero-img {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  padding: 2.25rem;
  background-color: var(--color-card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1.25rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.feature-desc {
  color: var(--color-text-muted);
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  text-align: center;
}

.stat-value {
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  color: var(--color-text-muted);
}

/* Testimonials */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.testimonial-card {
  padding: 2.25rem;
  background: var(--color-card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.stars {
  color: #f59e0b;
  margin-bottom: 1rem;
}

.testimonial-quote {
  font-style: italic;
  margin-bottom: 1.5rem;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

/* Responsive queries */
@media (max-width: 992px) {
  .hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  .mobile-toggle {
    display: block;
  }
}
`;
  }

  /**
   * Generates clean script.js
   */
  generateScriptJs() {
    return `/**
 * Generated by ReverseBuilder
 * Frontend Interactivity Script
 */
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // Smooth Scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElem = document.querySelector(targetId);
      if (targetElem) {
        e.preventDefault();
        targetElem.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
`;
  }

  /**
   * Generates README.md for the exported project
   */
  generateReadmeMd(project) {
    const name = project.name || 'Exported Website';
    return `# ${name}

Generated with **ReverseBuilder** — Website Reverse Engineering & Visual Rebuilding Platform.

## 🚀 Quick Start

To preview and run this website locally:

\`\`\`bash
# Python
python -m http.server 8080

# Or Node.js
npx serve .
\`\`\`
Then open [http://localhost:8080](http://localhost:8080) in your browser.

## 📁 Project Structure

- \`index.html\` — Semantic HTML5 structure with all customized elements and styles.
- \`styles.css\` — Zero-dependency, modern responsive CSS.
- \`script.js\` — Vanilla JavaScript interactions.

Exported on: ${new Date().toISOString()}
`;
  }

  /**
   * Bundles the project into a ZIP archive buffer
   */
  async createZipArchive(project) {
    const zip = new JSZip();

    const html = this.generateIndexHtml(project);
    const css = this.generateStylesCss(project);
    const js = this.generateScriptJs();
    const readme = this.generateReadmeMd(project);

    zip.file('index.html', html);
    zip.file('styles.css', css);
    zip.file('script.js', js);
    zip.file('README.md', readme);

    return await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  }
}

module.exports = new ExportService();
module.exports.ExportService = ExportService;

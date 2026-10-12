const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const config = require('../config');
const { validateUrl } = require('../validators/url-validator');

class CrawlerService {
  constructor() {
    this.playwright = null;
    try {
      this.playwright = require('playwright');
    } catch (e) {
      console.warn('Playwright not directly loadable, fallback crawler will be active.');
    }
  }

  /**
   * Crawls a permitted URL, captures screenshots, and extracts the authentic webpage DOM & styles safely.
   */
  async crawlUrl(targetUrl) {
    // 1. SSRF and URL validation
    const validation = await validateUrl(targetUrl);
    if (!validation.valid) {
      throw new Error(`SSRF / URL Validation Error: ${validation.error}`);
    }

    const safeUrl = validation.url;
    const filename = `url-snapshot-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.png`;
    const screenshotPath = path.join(config.uploadsDir, filename);
    const screenshotUrl = `/uploads/${filename}`;

    await fs.mkdir(config.uploadsDir, { recursive: true });

    let extractedData = null;
    let screenshotCaptured = false;

    // 2. Attempt Playwright Crawl
    if (this.playwright) {
      let browser = null;
      try {
        const launchOptions = {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        };
        try {
          browser = await this.playwright.chromium.launch({ ...launchOptions, channel: 'msedge' });
        } catch (e1) {
          try {
            browser = await this.playwright.chromium.launch({ ...launchOptions, channel: 'chrome' });
          } catch (e2) {
            browser = await this.playwright.chromium.launch(launchOptions);
          }
        }

        const context = await browser.newContext({
          bypassCSP: true,
          viewport: { width: 1280, height: 800 },
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (ReverseBuilder/1.0)'
        });

        const page = await context.newPage();

        // Navigate with timeout
        await page.goto(safeUrl, {
          waitUntil: 'domcontentloaded',
          timeout: config.crawlerTimeoutMs
        });

        // Allow SPAs (YouTube, React, Vue, Google, etc.) to hydrate their DOM
        try {
          await page.waitForLoadState('networkidle', { timeout: 3500 });
        } catch (e) {}
        await page.waitForTimeout(1500);

        // Capture screenshot
        await page.screenshot({ path: screenshotPath, fullPage: false });
        screenshotCaptured = true;

        // In-page authentic DOM extraction
        extractedData = await page.evaluate((pageUrl) => {
          const title = document.title || 'Reconstructed Website';
          const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

          // 1. Convert relative asset URLs to absolute
          document.querySelectorAll('img').forEach(img => {
            try {
              const src = img.getAttribute('src');
              if (src && !src.startsWith('data:')) {
                img.setAttribute('src', new URL(src, pageUrl).href);
              }
            } catch (e) {}
          });

          // 2. Mark link targets safely without setting javascript: into href (avoids TrustedTypes violation)
          document.querySelectorAll('a').forEach(a => {
            try {
              const href = a.getAttribute('href');
              if (href && !href.startsWith('javascript:')) {
                a.setAttribute('data-target-href', new URL(href, pageUrl).href);
              }
            } catch (e) {}
            try {
              a.removeAttribute('target');
              a.removeAttribute('onclick');
            } catch (e) {}
          });

          // 3. Extract external stylesheet URLs
          document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            try {
              const href = link.getAttribute('href');
              if (href) link.setAttribute('href', new URL(href, pageUrl).href);
            } catch (e) {}
          });

          const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(l => l.href)
            .filter(Boolean);

          // 4. Extract inline styles
          const inlineStyles = Array.from(document.querySelectorAll('style'))
            .map(s => s.innerHTML)
            .filter(Boolean);

          // 5. Clean scripts, noscripts, iframes safely
          document.querySelectorAll('script, noscript, base, iframe, embed, object').forEach(s => {
            try { s.remove(); } catch (e) {}
          });

          // Clean inline on* event listeners
          document.querySelectorAll('*').forEach(el => {
            try {
              const attrs = Array.from(el.attributes);
              attrs.forEach(attr => {
                if (attr.name.toLowerCase().startsWith('on')) {
                  el.removeAttribute(attr.name);
                }
              });
              if (el.hasAttribute('target')) el.removeAttribute('target');
            } catch (e) {}
          });

          // Body computed styling
          const body = document.body;
          const bodyStyle = window.getComputedStyle(body);
          const bodyBg = bodyStyle.backgroundColor || '#ffffff';
          const bodyColor = bodyStyle.color || '#0f172a';
          const bodyFont = bodyStyle.fontFamily || "'Inter', sans-serif";

          // 6. Section Extraction with Root Container Unwrapping (Never drops content)
          let container = body;
          while (
            container.children.length === 1 &&
            ['div', 'main', 'section', 'article', 'body'].includes(container.children[0].tagName.toLowerCase())
          ) {
            container = container.children[0];
          }

          const rawChildren = Array.from(container.children).filter(el => {
            const tag = el.tagName.toLowerCase();
            return !['style', 'script', 'noscript', 'meta', 'link', 'template'].includes(tag);
          });

          let sections = [];

          // If container has distinct top children (between 1 and 25)
          if (rawChildren.length >= 1 && rawChildren.length <= 25) {
            sections = rawChildren
              .filter(el => {
                return el.outerHTML.length >= 25 || (el.innerText || el.textContent || '').trim().length > 0 || el.querySelector('img, svg, input');
              })
              .map((el, i) => {
                const tag = el.tagName.toLowerCase();
                const hasInput = !!el.querySelector('input, textarea');
                const hasH1 = !!el.querySelector('h1, h2');
                const text = (el.innerText || el.textContent || '').trim().slice(0, 300);

                let name = `Section ${i + 1}`;
                if (tag === 'header' || el.classList.contains('header') || el.id.toLowerCase().includes('header')) name = 'Header Navigation';
                else if (tag === 'footer' || el.classList.contains('footer') || el.id.toLowerCase().includes('footer')) name = 'Page Footer';
                else if (tag === 'nav') name = 'Navigation Menu';
                else if (hasInput) name = 'Interactive Showcase & Form';
                else if (hasH1 || i === 0 || i === 1) name = `Showcase Block ${i + 1}`;
                else name = `Content Section ${i + 1} (${tag})`;

                return {
                  id: `sec-${i + 1}`,
                  type: 'raw-html',
                  name,
                  props: {
                    html: el.outerHTML,
                    text
                  },
                  styles: {
                    backgroundColor: 'transparent',
                    textColor: 'inherit',
                    paddingTop: 0,
                    paddingBottom: 0
                  }
                };
              });
          }

          // Fallback if rawChildren was empty or fragmented: extract semantic candidates or full body
          if (sections.length === 0) {
            const semantic = Array.from(body.querySelectorAll('header, nav, main, section, article, footer'));
            const topSemantic = semantic.filter(el => {
              let p = el.parentElement;
              while (p && p !== body) {
                if (semantic.includes(p)) return false;
                p = p.parentElement;
              }
              return true;
            });

            if (topSemantic.length >= 2) {
              sections = topSemantic.map((el, i) => ({
                id: `sec-${i + 1}`,
                type: 'raw-html',
                name: `Section ${i + 1} (${el.tagName.toLowerCase()})`,
                props: {
                  html: el.outerHTML,
                  text: (el.innerText || el.textContent || '').trim().slice(0, 300)
                },
                styles: {
                  backgroundColor: 'transparent',
                  textColor: 'inherit',
                  paddingTop: 0,
                  paddingBottom: 0
                }
              }));
            } else {
              sections = [{
                id: 'sec-1',
                type: 'raw-html',
                name: 'Main Page Content',
                props: {
                  html: container.innerHTML || body.innerHTML,
                  text: (body.innerText || body.textContent || '').trim().slice(0, 300)
                },
                styles: {
                  backgroundColor: 'transparent',
                  textColor: 'inherit',
                  paddingTop: 0,
                  paddingBottom: 0
                }
              }];
            }
          }

          return {
            title,
            metaDesc,
            stylesheets,
            inlineStyles,
            sections,
            bodyBg,
            bodyColor,
            bodyFont
          };
        }, safeUrl);

        await browser.close();
      } catch (err) {
        console.warn(`Playwright extraction failed (${err.message}). Attempting fetch fallback...`);
        if (browser) {
          try { await browser.close(); } catch (e) {}
        }
      }
    }

    // 3. Fallback extraction via HTTP fetch
    if (!extractedData) {
      extractedData = await this._fallbackFetch(safeUrl);
    }

        // Sanitize and neutralize all extracted sections in Node.js
    if (extractedData && Array.isArray(extractedData.sections)) {
      extractedData.sections.forEach(sec => {
        if (sec.props && sec.props.html) {
          // Neutralize links: ensure href="javascript:void(0);" and data-target-href
          sec.props.html = sec.props.html.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
            let targetHref = '';
            const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
            if (hrefMatch && hrefMatch[1] && !hrefMatch[1].startsWith('javascript:')) {
              try {
                targetHref = new URL(hrefMatch[1], safeUrl).href;
              } catch (e) {
                targetHref = hrefMatch[1];
              }
            }
            const dataHrefMatch = attrs.match(/data-target-href=["']([^"']*)["']/i);
            if (dataHrefMatch && dataHrefMatch[1]) {
              targetHref = dataHrefMatch[1];
            }
            let cleanAttrs = attrs
              .replace(/\s+href=["'][^"']*["']/gi, '')
              .replace(/\s+data-target-href=["'][^"']*["']/gi, '')
              .replace(/\s+target=["'][^"']*["']/gi, '')
              .replace(/\s+onclick=["'][^"']*["']/gi, '');
            return `<a ${cleanAttrs} data-target-href="${targetHref}" href="javascript:void(0);">`;
          });

          // Neutralize forms
          sec.props.html = sec.props.html.replace(/<form\b([^>]*)>/gi, '<form $1 onsubmit="return false;" action="javascript:void(0);">');
        }
      });
    }

    // 4. Fallback screenshot
    if (!screenshotCaptured) {
      await this._createPlaceholderScreenshot(screenshotPath, extractedData.title);
    }

    return {
      url: safeUrl,
      screenshotUrl,
      screenshotPath,
      extracted: extractedData
    };
  }

  async _fallbackFetch(safeUrl) {
    const res = await fetch(safeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReverseBuilder/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    let html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Reconstructed Website';

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDesc = descMatch ? descMatch[1].trim() : '';

    // Extract stylesheets
    const stylesheets = [];
    const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      try {
        stylesheets.push(new URL(match[1], safeUrl).href);
      } catch (e) {}
    }

    // Extract inline styles
    const inlineStyles = [];
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    while ((match = styleRegex.exec(html)) !== null) {
      inlineStyles.push(match[1]);
    }

    // Remove scripts, noscripts, base, iframes, and inline event handlers
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
    html = html.replace(/<base\b[^>]*>/gi, '');
    html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    html = html.replace(/\s+on\w+="[^"]*"/gi, '');
    html = html.replace(/\s+on\w+='[^']*'/gi, '');
    html = html.replace(/\s+target=["'][^"']*["']/gi, '');

    // Neutralize forms
    html = html.replace(/<form\b([^>]*)>/gi, '<form $1 onsubmit="return false;" action="javascript:void(0);">');

    // Neutralize links for editing
    html = html.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
      let targetHref = '';
      const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
      if (hrefMatch && hrefMatch[1] && !hrefMatch[1].startsWith('javascript:')) {
        try {
          targetHref = new URL(hrefMatch[1], safeUrl).href;
        } catch (e) {
          targetHref = hrefMatch[1];
        }
      }
      let cleanAttrs = attrs
        .replace(/\s+href=["'][^"']*["']/gi, '')
        .replace(/\s+target=["'][^"']*["']/gi, '')
        .replace(/\s+onclick=["'][^"']*["']/gi, '');
      return `<a ${cleanAttrs} data-target-href="${targetHref}" href="javascript:void(0);">`;
    });

    // Resolve relative image URLs
    html = html.replace(/src=["'](?!https?:\/\/|data:|#)(\/[^"']*)["']/gi, (m, val) => {
      try {
        return `src="${new URL(val, safeUrl).href}"`;
      } catch (e) {
        return m;
      }
    });

    // Extract body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    const sections = [{
      id: 'sec-1',
      type: 'raw-html',
      name: 'Main Page Content',
      props: {
        html: bodyContent,
        text: 'Reconstructed webpage content'
      },
      styles: {
        backgroundColor: 'transparent',
        textColor: 'inherit',
        paddingTop: 20,
        paddingBottom: 20
      }
    }];

    return {
      title,
      metaDesc,
      stylesheets,
      inlineStyles,
      sections,
      bodyBg: '#ffffff',
      bodyColor: '#0f172a',
      bodyFont: "'Inter', sans-serif"
    };
  }

  async _createPlaceholderScreenshot(targetPath, title) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="800" fill="url(#bg)"/>
      <rect x="60" y="40" width="1160" height="50" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <circle cx="90" cy="65" r="7" fill="#ef4444"/>
      <circle cx="115" cy="65" r="7" fill="#f59e0b"/>
      <circle cx="140" cy="65" r="7" fill="#10b981"/>
      <text x="640" y="72" fill="#94a3b8" font-family="sans-serif" font-size="16" text-anchor="middle">ReverseBuilder Snapshot: ${title.replace(/[<>&"]/g, '')}</text>
      <rect x="140" y="180" width="480" height="40" rx="6" fill="#38bdf8"/>
      <rect x="140" y="240" width="400" height="20" rx="4" fill="#64748b"/>
      <rect x="140" y="325" width="160" height="48" rx="8" fill="#4f46e5"/>
    </svg>`;

    const svgPath = targetPath.replace(/\.png$/, '.svg');
    await fs.writeFile(svgPath, svg, 'utf8');
    await fs.writeFile(targetPath, svg, 'utf8');
  }
}

module.exports = new CrawlerService();
module.exports.CrawlerService = CrawlerService;

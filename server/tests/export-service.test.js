const test = require('node:test');
const assert = require('node:assert');
const JSZip = require('jszip');
const exportService = require('../services/export-service');

test('Export Service & ZIP Packaging Suite', async (t) => {
  const sampleProject = {
    id: 'test-export-proj',
    name: 'Export Test Website',
    description: 'Testing HTML/CSS generation',
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#10b981',
      backgroundColor: '#ffffff',
      textColor: '#0f172a'
    },
    sections: [
      {
        id: 'sec-1',
        type: 'navbar',
        props: { brandName: 'ExportTest', links: [{ label: 'Home', href: '#' }] },
        styles: { paddingTop: 20, paddingBottom: 20 }
      },
      {
        id: 'sec-2',
        type: 'hero',
        props: { heading: 'Hero Heading Test', subheading: 'Hero Sub test' },
        styles: { paddingTop: 60, paddingBottom: 60 }
      },
      {
        id: 'sec-3',
        type: 'features',
        props: {
          heading: 'Key Features',
          items: [{ icon: '⚡', title: 'Speed', description: 'Fast' }]
        },
        styles: { paddingTop: 60, paddingBottom: 60 }
      }
    ]
  };

  await t.test('generates valid semantic HTML document', () => {
    const html = exportService.generateIndexHtml(sampleProject);
    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('<title>Export Test Website</title>'));
    assert.ok(html.includes('class="section-navbar"'));
    assert.ok(html.includes('class="section-hero"'));
    assert.ok(html.includes('Hero Heading Test'));
    assert.ok(html.includes('class="section-features"'));
    assert.ok(html.includes('<script src="script.js"></script>'));
  });

  await t.test('generates clean responsive CSS with custom variables', () => {
    const css = exportService.generateStylesCss(sampleProject);
    assert.ok(css.includes('--color-primary: #6366f1;'));
    assert.ok(css.includes('--color-bg: #ffffff;'));
    assert.ok(css.includes('@media (max-width: 768px)'));
    assert.ok(css.includes('.hero-container'));
  });

  await t.test('creates readable README.md with local run commands', () => {
    const readme = exportService.generateReadmeMd(sampleProject);
    assert.ok(readme.includes('# Export Test Website'));
    assert.ok(readme.includes('python -m http.server 8080'));
  });

  await t.test('assembles and produces valid ZIP archive containing all files', async () => {
    const zipBuffer = await exportService.createZipArchive(sampleProject);
    assert.ok(Buffer.isBuffer(zipBuffer));
    assert.ok(zipBuffer.length > 500);

    // Unpack ZIP to verify entries
    const unzipped = await JSZip.loadAsync(zipBuffer);
    assert.ok(unzipped.file('index.html'));
    assert.ok(unzipped.file('styles.css'));
    assert.ok(unzipped.file('script.js'));
    assert.ok(unzipped.file('README.md'));

    const htmlContent = await unzipped.file('index.html').async('string');
    assert.ok(htmlContent.includes('Hero Heading Test'));
  });
});

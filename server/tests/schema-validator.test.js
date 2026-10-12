const test = require('node:test');
const assert = require('node:assert');
const { validateProject, normalizeSection, escapeHtml, SUPPORTED_SECTION_TYPES } = require('../validators/schema-validator');

test('Schema Validator & AST Normalizer Suite', async (t) => {
  await t.test('escapes malicious HTML characters to prevent XSS', () => {
    const malicious = '<script>alert("XSS")</script>&"\'';
    const escaped = escapeHtml(malicious);
    assert.strictEqual(escaped.includes('<script>'), false);
    assert.strictEqual(escaped.includes('&lt;script&gt;'), true);
  });

  await t.test('normalizes unknown section types safely to fallback block', () => {
    const raw = { type: 'unsupported-mystery-widget', props: { heading: 'Hello' } };
    const normalized = normalizeSection(raw);
    assert.strictEqual(normalized.type, 'text-block');
    assert.ok(normalized.id);
  });

  await t.test('enforces style boundaries and defaults on section styles', () => {
    const raw = {
      type: 'hero',
      styles: { paddingTop: 9999, maxWidth: 50 }
    };
    const normalized = normalizeSection(raw);
    // Max paddingTop capped at 300, min maxWidth clamped at 300
    assert.strictEqual(normalized.styles.paddingTop, 300);
    assert.strictEqual(normalized.styles.maxWidth, 300);
  });

  await t.test('validates complete project AST and supplies theme defaults', () => {
    const input = {
      name: 'Test Project',
      sections: [
        { type: 'navbar', props: { brandName: 'Alpha' } },
        { type: 'hero', props: { heading: 'Main Title' } }
      ]
    };

    const res = validateProject(input);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.project.name, 'Test Project');
    assert.strictEqual(res.project.sections.length, 2);
    assert.strictEqual(res.project.theme.primaryColor, '#4f46e5');
    assert.ok(res.project.createdAt > 0);
  });
});

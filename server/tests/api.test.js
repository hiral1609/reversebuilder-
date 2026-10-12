const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../server');

test('REST API Endpoints Integration Suite', async (t) => {
  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  let createdId = null;

  await t.test('GET /api/health returns 200 and feature flags', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.features);
  });

  await t.test('GET /api/templates returns 5 sample templates', async () => {
    const res = await fetch(`${baseUrl}/api/templates`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.count, 5);
    assert.strictEqual(data.data[0].id, 'tpl-saas-landing');
  });

  await t.test('POST /api/projects creates new project from template', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cloned SaaS Site',
        templateId: 'tpl-saas-landing'
      })
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.strictEqual(body.data.name, 'Cloned SaaS Site');
    assert.ok(body.data.sections.length >= 5);
    createdId = body.data.id;
  });

  await t.test('GET /api/projects/:id loads project correctly', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${createdId}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, createdId);
  });

  await t.test('PATCH /api/projects/:id updates project sections', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated SaaS Name',
        sections: [
          {
            type: 'hero',
            props: { heading: 'Updated Brand New Headline' }
          }
        ]
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.name, 'Updated SaaS Name');
    assert.strictEqual(body.data.sections.length, 1);
  });

  await t.test('POST /api/projects/:id/export returns downloadable ZIP', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${createdId}/export`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/zip');
    const buffer = await res.arrayBuffer();
    assert.ok(buffer.byteLength > 500);
  });

  await t.test('POST /api/import/url rejects localhost via SSRF protection', async () => {
    const res = await fetch(`${baseUrl}/api/import/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:3000' })
    });
    // Should fail with 500 or 400 with SSRF validation error message
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('restricted') || body.error.includes('SSRF'));
  });

  await t.test('DELETE /api/projects/:id removes project', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${createdId}`, {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 200);

    const check = await fetch(`${baseUrl}/api/projects/${createdId}`);
    assert.strictEqual(check.status, 404);
  });

  await new Promise((resolve) => server.close(resolve));
});

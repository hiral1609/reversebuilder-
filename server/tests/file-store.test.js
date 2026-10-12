const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs').promises;
const { FileStore } = require('../storage/file-store');

test('FileStore CRUD and Traversal Protection Suite', async (t) => {
  const testDir = path.resolve(__dirname, 'test-data-' + Date.now());
  const store = new FileStore(testDir);
  await store.init();

  let createdProjectId = null;

  await t.test('creates project with sanitized file structure', async () => {
    const proj = await store.create({
      name: 'Integration Test Project',
      sections: [{ type: 'hero', props: { heading: 'Hello World' } }]
    });

    assert.ok(proj.id);
    assert.strictEqual(proj.name, 'Integration Test Project');
    createdProjectId = proj.id;
  });

  await t.test('retrieves project by ID', async () => {
    const proj = await store.getById(createdProjectId);
    assert.ok(proj);
    assert.strictEqual(proj.id, createdProjectId);
    assert.strictEqual(proj.sections.length, 1);
  });

  await t.test('lists projects with search filter', async () => {
    const list1 = await store.list({ search: 'Integration' });
    assert.strictEqual(list1.length, 1);

    const list2 = await store.list({ search: 'NonExistentXYZ' });
    assert.strictEqual(list2.length, 0);
  });

  await t.test('updates project properties and sections atomically', async () => {
    const updated = await store.update(createdProjectId, {
      name: 'Renamed Project',
      sections: [
        { type: 'hero', props: { heading: 'New Heading' } },
        { type: 'features', props: { heading: 'Features Heading' } }
      ]
    });

    assert.strictEqual(updated.name, 'Renamed Project');
    assert.strictEqual(updated.sections.length, 2);

    const reloaded = await store.getById(createdProjectId);
    assert.strictEqual(reloaded.name, 'Renamed Project');
  });

  await t.test('duplicates project', async () => {
    const dupe = await store.duplicate(createdProjectId);
    assert.ok(dupe);
    assert.notStrictEqual(dupe.id, createdProjectId);
    assert.strictEqual(dupe.name, 'Renamed Project (Copy)');
    assert.strictEqual(dupe.sections.length, 2);

    // Clean up duplicate
    await store.delete(dupe.id);
  });

  await t.test('prevents path traversal attacks in ID lookups', async () => {
    await assert.rejects(
      async () => {
        await store.getById('../../etc/passwd');
      },
      /Security violation/
    );
  });

  await t.test('deletes project and cleans up', async () => {
    const deleted = await store.delete(createdProjectId);
    assert.strictEqual(deleted, true);

    const check = await store.getById(createdProjectId);
    assert.strictEqual(check, null);
  });

  // Cleanup test folder
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (e) {}
});

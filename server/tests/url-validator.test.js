const test = require('node:test');
const assert = require('node:assert');
const { validateUrl, isPrivateIp, isPrivateIPv4, isPrivateIPv6 } = require('../validators/url-validator');

test('URL & SSRF Validator Suite', async (t) => {
  await t.test('blocks localhost and loopback hosts', async () => {
    const res1 = await validateUrl('http://localhost');
    assert.strictEqual(res1.valid, false);

    const res2 = await validateUrl('http://127.0.0.1:8080');
    assert.strictEqual(res2.valid, false);

    const res3 = await validateUrl('http://localhost:3000/api');
    assert.strictEqual(res3.valid, false);
  });

  await t.test('blocks cloud metadata endpoints', async () => {
    const res1 = await validateUrl('http://169.254.169.254/latest/meta-data/');
    assert.strictEqual(res1.valid, false);

    const res2 = await validateUrl('http://metadata.google.internal/computeMetadata/v1/');
    assert.strictEqual(res2.valid, false);
  });

  await t.test('detects private IPv4 networks accurately', () => {
    assert.strictEqual(isPrivateIPv4('10.0.0.1'), true);
    assert.strictEqual(isPrivateIPv4('10.255.255.255'), true);
    assert.strictEqual(isPrivateIPv4('172.16.0.1'), true);
    assert.strictEqual(isPrivateIPv4('172.31.255.255'), true);
    assert.strictEqual(isPrivateIPv4('192.168.1.1'), true);
    assert.strictEqual(isPrivateIPv4('192.168.254.254'), true);
    assert.strictEqual(isPrivateIPv4('127.0.0.1'), true);
    assert.strictEqual(isPrivateIPv4('0.0.0.0'), true);
    assert.strictEqual(isPrivateIPv4('169.254.1.1'), true);
    
    // Public IPs should not be marked private
    assert.strictEqual(isPrivateIPv4('8.8.8.8'), false);
    assert.strictEqual(isPrivateIPv4('1.1.1.1'), false);
    assert.strictEqual(isPrivateIPv4('142.250.190.46'), false);
  });

  await t.test('detects private IPv6 addresses', () => {
    assert.strictEqual(isPrivateIPv6('::1'), true);
    assert.strictEqual(isPrivateIPv6('fe80::1'), true);
    assert.strictEqual(isPrivateIPv6('fc00::1'), true);
    assert.strictEqual(isPrivateIPv6('::ffff:127.0.0.1'), true);
  });

  await t.test('rejects non-HTTP protocols', async () => {
    const res1 = await validateUrl('file:///etc/passwd');
    assert.strictEqual(res1.valid, false);

    const res2 = await validateUrl('ftp://example.com/file');
    assert.strictEqual(res2.valid, false);

    const res3 = await validateUrl('javascript:alert(1)');
    assert.strictEqual(res3.valid, false);
  });

  await t.test('permits valid public URLs', async () => {
    // example.com is guaranteed public
    const res = await validateUrl('https://example.com');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.hostname, 'example.com');
  });
});

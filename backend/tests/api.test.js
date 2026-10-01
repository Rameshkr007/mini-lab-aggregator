const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

let server;
let base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((r) => server.close(r)));

const get = async (qs) => {
  const res = await fetch(`${base}/api/search?${qs}`);
  return { status: res.status, body: await res.json() };
};

test('200: Lipid Profile + 110001 returns 4 results sorted by final price', async () => {
  const { status, body } = await get('search_query=Lipid%20Profile&pincode=110001');
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(body.query, { search_query: 'Lipid Profile', pincode: '110001' });
  assert.equal(body.count, 4);
  assert.deepEqual(body.results.map((r) => r.total_final_price), [450, 900, 1650, 1999]);
});

test('200: trims whitespace and ignores case', async () => {
  const { status, body } = await get('search_query=%20%20mri%20BRAIN%20&pincode=560034');
  assert.equal(status, 200);
  assert.equal(body.results[0].id, '105');
});

test('400: invalid pincodes (short, letters, empty, missing)', async () => {
  for (const qs of [
    'search_query=Lipid%20Profile&pincode=1100',
    'search_query=Lipid%20Profile&pincode=11000a',
    'search_query=Lipid%20Profile&pincode=',
    'search_query=Lipid%20Profile',
    'search_query=Lipid%20Profile&pincode=1100011',
    'search_query=Lipid%20Profile&pincode=110001&pincode=110002',
  ]) {
    const { status, body } = await get(qs);
    assert.equal(status, 400, qs);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'INVALID_PINCODE');
    assert.equal(body.error.message, 'Please enter a valid 6-digit pincode.');
  }
});

test('400: empty or missing test name', async () => {
  for (const qs of ['search_query=&pincode=110001', 'search_query=%20%20&pincode=110001', 'pincode=110001']) {
    const { status, body } = await get(qs);
    assert.equal(status, 400, qs);
    assert.equal(body.error.code, 'INVALID_SEARCH_QUERY');
  }
});

test('404: unknown test returns consistent error body', async () => {
  const { status, body } = await get('search_query=Unobtainium&pincode=110001');
  assert.equal(status, 404);
  assert.equal(body.success, false);
  assert.equal(body.error.code, 'NO_RESULTS');
});

test('404: valid test but unserved pincode', async () => {
  const { status, body } = await get('search_query=MRI%20Brain&pincode=110001');
  assert.equal(status, 404);
  assert.equal(body.error.code, 'NO_RESULTS');
});

test('unknown route gives JSON 404 with no stack trace', async () => {
  const res = await fetch(`${base}/api/nope`);
  const text = await res.text();
  assert.equal(res.status, 404);
  assert.ok(!text.includes('at '));
  assert.equal(JSON.parse(text).error.code, 'ROUTE_NOT_FOUND');
});

test('regex-special characters in the query are handled safely', async () => {
  const { status } = await get('search_query=' + encodeURIComponent('(.*[') + '&pincode=110001');
  assert.equal(status, 404);
});

test('CORS: allows the local dev origins, not arbitrary ones', async () => {
  for (const origin of ['http://localhost:5173', 'http://127.0.0.1:5173']) {
    const res = await fetch(`${base}/api/health`, { headers: { Origin: origin } });
    assert.equal(res.headers.get('access-control-allow-origin'), origin);
  }
  const res = await fetch(`${base}/api/health`, { headers: { Origin: 'http://evil.example' } });
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

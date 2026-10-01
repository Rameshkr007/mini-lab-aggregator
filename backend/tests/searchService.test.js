const test = require('node:test');
const assert = require('node:assert/strict');
const { searchLabs, computeFinalPrice } = require('../src/services/searchService');

const search = (searchQuery, pincode) => searchLabs({ searchQuery, pincode });

test('Lipid Profile + 110001 returns standalone tests AND packages', () => {
  const results = search('Lipid Profile', '110001');
  assert.equal(results.length, 4);
  const types = new Set(results.map((r) => r.item_type));
  assert.ok(types.has('test') && types.has('package'));
});

test('providers not serving the pincode are excluded', () => {
  const r110001 = search('Lipid Profile', '110001').map((r) => r.id);
  assert.ok(r110001.includes('102')); // Local City Lab serves only 110001

  const r110002 = search('Lipid Profile', '110002').map((r) => r.id);
  assert.ok(!r110002.includes('102'));
  assert.ok(!r110002.includes('104')); // Lal PathLabs does not serve 110002
  assert.deepEqual(r110002.sort(), ['101', '103']);
});

test('packages match through included_tests, not just item_name', () => {
  const results = search('Lipid Profile', '110001');
  const pkgs = results.filter((r) => r.item_type === 'package');
  assert.deepEqual(pkgs.map((p) => p.id).sort(), ['103', '104']);
  for (const p of pkgs) {
    assert.notEqual(p.item_name.toLowerCase(), 'lipid profile');
    assert.equal(p.match_type, 'included');
  }
  // A test that only exists inside packages still resolves
  const ecg = search('ECG', '110001');
  assert.deepEqual(ecg.map((r) => r.id), ['103']);
});

test('total_final_price = offer_price + home_collection_fee', () => {
  const byId = Object.fromEntries(search('Lipid Profile', '110001').map((r) => [r.id, r]));
  assert.equal(byId['101'].total_final_price, 900); // 800 + 100
  assert.equal(byId['102'].total_final_price, 450); // 450 + 0
  assert.equal(byId['103'].total_final_price, 1999); // free collection
  assert.equal(byId['104'].total_final_price, 1650); // 1500 + 150
});

test('results are sorted ascending by total_final_price', () => {
  const prices = search('Lipid Profile', '110001').map((r) => r.total_final_price);
  assert.deepEqual(prices, [450, 900, 1650, 1999]);
});

test('sorting uses final price, not offer price alone', () => {
  // A: offer 500 + fee 400 = 900 ; B: offer 800 + fee 0 = 800 -> B must come first
  const dataset = [
    mk('A', 500, 400),
    mk('B', 800, 0),
  ];
  const out = searchLabs({ searchQuery: 'x test', pincode: '110001' }, dataset);
  assert.deepEqual(out.map((r) => r.id), ['B', 'A']);
});

test('MRI Brain + 560034 finds the MRI provider', () => {
  const results = search('MRI Brain', '560034');
  assert.equal(results.length, 1);
  assert.equal(results[0].provider_name, 'Local Scan Centre');
  assert.equal(results[0].total_final_price, 4200);
});

test('unknown test yields a clean empty array', () => {
  assert.deepEqual(search('Nonexistent Panel', '110001'), []);
});

test('search is case-insensitive and whitespace-tolerant', () => {
  const base = search('Lipid Profile', '110001').map((r) => r.id);
  for (const q of ['lipid profile', 'LIPID PROFILE', 'LiPiD PrOfIlE', '  Lipid   Profile  ']) {
    assert.deepEqual(search(q, '110001').map((r) => r.id), base, q);
  }
});

test('unavailable pincode returns nothing', () => {
  assert.deepEqual(search('Lipid Profile', '999999'), []);
});

test('zero and non-zero collection fees are handled; fee ignored without home collection', () => {
  assert.equal(computeFinalPrice({ pricing: { offer_price: 450 }, logistics: { home_collection: false, home_collection_fee: 100 } }), 450);
  assert.equal(computeFinalPrice({ pricing: { offer_price: 1999 }, logistics: { home_collection: true, home_collection_fee: 0 } }), 1999);
});

test('missing optional fields do not crash the search', () => {
  const dataset = [{ id: 'z', provider_name: 'Bare Lab', item_type: 'test', item_name: 'X Test', available_pincodes: ['110001'] }];
  const [r] = searchLabs({ searchQuery: 'x test', pincode: '110001' }, dataset);
  assert.equal(r.total_final_price, 0);
  assert.deepEqual(r.included_tests, []);
  assert.equal(r.nabl_accredited, false);
});

test('source data is not mutated by searching', () => {
  const dataset = [mk('A', 100, 10)];
  const snapshot = JSON.stringify(dataset);
  searchLabs({ searchQuery: 'x test', pincode: '110001' }, dataset);
  assert.equal(JSON.stringify(dataset), snapshot);
});

function mk(id, offer, fee) {
  return {
    id,
    provider_name: `Lab ${id}`,
    item_type: 'test',
    item_name: 'X Test',
    included_tests: ['X Test'],
    available_pincodes: ['110001'],
    pricing: { mrp: offer * 2, offer_price: offer },
    logistics: { home_collection: fee > 0, home_collection_fee: fee, report_tat_hours: 24 },
    nabl_accredited: true,
  };
}

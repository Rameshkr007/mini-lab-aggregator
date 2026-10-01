import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice, formatHours, formatItemType, formatResultCount } from '../src/utils/format.js';
import { validateSearchInputs, matchesTerm } from '../src/utils/validate.js';

test('formatPrice uses rupee symbol and Indian grouping', () => {
  assert.equal(formatPrice(450), '₹450');
  assert.equal(formatPrice(1999), '₹1,999');
  assert.equal(formatPrice(100000), '₹1,00,000');
});

test('formatHours handles singular, plural and missing', () => {
  assert.equal(formatHours(24), '24 hours');
  assert.equal(formatHours(1), '1 hour');
  assert.equal(formatHours(null), 'Not specified');
});

test('item type and count labels', () => {
  assert.equal(formatItemType('package'), 'Package');
  assert.equal(formatItemType('test'), 'Single Test');
  assert.equal(formatResultCount(4), '4 results found');
  assert.equal(formatResultCount(1), '1 result found');
});

test('validateSearchInputs mirrors API rules', () => {
  assert.deepEqual(validateSearchInputs({ query: 'Lipid Profile', pincode: '110001' }), {});
  assert.ok(validateSearchInputs({ query: '   ', pincode: '110001' }).query);
  for (const bad of ['', '1100', '11000a', '1100011', ' 11 ']) {
    assert.equal(
      validateSearchInputs({ query: 'x', pincode: bad }).pincode,
      'Please enter a valid 6-digit pincode.',
      bad
    );
  }
});

test('matchesTerm is case-insensitive', () => {
  assert.equal(matchesTerm('Lipid Profile', 'lipid'), true);
  assert.equal(matchesTerm('ECG', 'lipid'), false);
  assert.equal(matchesTerm('ECG', ''), false);
});

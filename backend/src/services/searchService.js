const path = require('path');
const { normalizeText } = require('../utils/normalize');

// Load the mock "database" once at startup; never mutated afterwards.
const labs = require(path.join(__dirname, '..', '..', 'data', 'labs.json'));

/**
 * Does the normalized query match this catalogue item?
 * An item matches when the query matches its own name (standalone tests,
 * or a package searched by name) OR any entry in `included_tests`
 * (so packages surface when they contain the requested test).
 *
 * Matching is case/whitespace-insensitive and substring-based, so
 * "lipid" finds "Lipid Profile". Returns the match type, or null.
 */
function matchItem(item, query) {
  const name = normalizeText(item.item_name);
  if (name && name.includes(query)) return 'direct';

  const included = Array.isArray(item.included_tests) ? item.included_tests : [];
  if (included.some((t) => normalizeText(t).includes(query))) return 'included';

  return null;
}

/** Final payable amount = offer price + collection fee (fee only counts if collection is offered). */
function computeFinalPrice(item) {
  const offer = Number(item.pricing?.offer_price) || 0;
  const logistics = item.logistics || {};
  const fee = logistics.home_collection ? Number(logistics.home_collection_fee) || 0 : 0;
  return offer + fee;
}

/** Build the API result shape without mutating the source record. */
function toResult(item, matchType) {
  const logistics = item.logistics || {};
  return {
    id: item.id,
    provider_name: item.provider_name,
    item_type: item.item_type,
    item_name: item.item_name,
    included_tests: Array.isArray(item.included_tests) ? [...item.included_tests] : [],
    pricing: {
      mrp: Number(item.pricing?.mrp) || 0,
      offer_price: Number(item.pricing?.offer_price) || 0,
    },
    logistics: {
      home_collection: Boolean(logistics.home_collection),
      home_collection_fee: logistics.home_collection ? Number(logistics.home_collection_fee) || 0 : 0,
      report_tat_hours: logistics.report_tat_hours ?? null,
    },
    nabl_accredited: item.nabl_accredited === true,
    match_type: matchType, // "direct" = item itself, "included" = inside a package
    total_final_price: computeFinalPrice(item),
  };
}

/**
 * Search the catalogue.
 * Pipeline: pincode filter -> test/package match -> enrich -> sort by final price ASC.
 * `dataset` is injectable so tests can run against custom data.
 */
function searchLabs({ searchQuery, pincode }, dataset = labs) {
  const query = normalizeText(searchQuery);
  if (!query) return [];

  const results = [];
  for (const item of dataset) {
    const pincodes = Array.isArray(item.available_pincodes) ? item.available_pincodes : [];
    if (!pincodes.includes(pincode)) continue;

    const matchType = matchItem(item, query);
    if (!matchType) continue;

    results.push(toResult(item, matchType));
  }

  // Primary: true final price. Ties: provider name, so ordering is deterministic.
  return results.sort(
    (a, b) =>
      a.total_final_price - b.total_final_price ||
      a.provider_name.localeCompare(b.provider_name)
  );
}

module.exports = { searchLabs, computeFinalPrice, matchItem };

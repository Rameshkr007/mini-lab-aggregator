/**
 * Normalize free text for matching: trim, collapse inner whitespace, lowercase.
 * Non-strings become an empty string so callers never have to guard.
 */
function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

module.exports = { normalizeText };

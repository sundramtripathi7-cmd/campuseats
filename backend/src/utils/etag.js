const crypto = require('crypto');

function formatValue(key, val) {
  if (key === 'price' && typeof val === 'number') {
    return Number.isInteger(val) ? val.toFixed(1) : String(val);
  }
  return canonicalJson(val);
}

function canonicalJson(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + formatValue(k, obj[k])).join(',') + '}';
}

/**
 * Generate stable 16-character SHA-256 ETag matching Python's etag_for
 */
function etagFor(resource) {
  const payload = canonicalJson(resource);
  const digest = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  return `"${digest.slice(0, 16)}"`;
}

/**
 * Check If-None-Match according to HTTP ETag semantics:
 * Supports exact ETag, multiple comma-separated ETags, wildcard *, and weak W/"..."
 */
function etagMatches(ifNoneMatch, currentEtag) {
  if (!ifNoneMatch) return false;
  const value = ifNoneMatch.trim();
  if (value === '*') return true;
  const current = currentEtag.trim();

  for (let candidate of value.split(',')) {
    candidate = candidate.trim();
    if (candidate.startsWith('W/')) {
      candidate = candidate.slice(2).trim();
    }
    if (candidate === current) {
      return true;
    }
  }
  return false;
}

module.exports = {
  etagFor,
  etagMatches,
};


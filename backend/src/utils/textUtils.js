/**
 * Normalize whitespace in a string.
 * @param {string} str
 * @returns {string}
 */
export function normalizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Search for a quotation within page text (case-insensitive).
 * @param {string} quotation
 * @param {string} pageText
 * @returns {{ found: boolean, normalizedQuote: string }}
 */
export function findQuotationInPage(quotation, pageText) {
  if (!quotation || !pageText) return { found: false, normalizedQuote: '' };

  const normalizedQuote = normalizeText(quotation);
  const normalizedPage = normalizeText(pageText);

  const found = normalizedPage.toLowerCase().includes(normalizedQuote.toLowerCase());
  return { found, normalizedQuote };
}

/**
 * Truncate a string to a maximum length, appending ellipsis if needed.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncateText(str, maxLen = 200) {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Extract the first complete JSON object from a string.
 * Handles LLM output wrapped in markdown code fences (```json ... ```).
 * @param {string} str
 * @returns {string|null}
 */
export function extractJsonFromString(str) {
  if (typeof str !== 'string') return null;

  // Strip markdown code fences
  const stripped = str
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return stripped.slice(firstBrace, lastBrace + 1);
}

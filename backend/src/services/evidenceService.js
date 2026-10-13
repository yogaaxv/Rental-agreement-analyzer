import { findQuotationInPage } from '../utils/textUtils.js';

/**
 * Verify evidence for all detail fields and conditions in the analysis result.
 * Annotates each item with { evidenceVerified: boolean }.
 *
 * @param {object} analysisResult - Parsed LLM output (details + conditions).
 * @param {Array<{ pageNumber: number, text: string }>} pageTexts
 * @returns {object} Annotated analysis result.
 */
export function verifyEvidence(analysisResult, pageTexts) {
  // Build a lookup map: pageNumber → text
  const pageMap = {};
  for (const { pageNumber, text } of pageTexts) {
    pageMap[pageNumber] = text;
  }

  const result = { ...analysisResult };

  // Verify details
  if (result.details && typeof result.details === 'object') {
    const verifiedDetails = {};
    for (const [key, detail] of Object.entries(result.details)) {
      if (!detail || typeof detail !== 'object') {
        verifiedDetails[key] = detail;
        continue;
      }

      let evidenceVerified = false;
      if (detail.quotation && detail.page != null) {
        const pageText = pageMap[detail.page] || '';
        const { found } = findQuotationInPage(detail.quotation, pageText);
        evidenceVerified = found;
      }

      verifiedDetails[key] = { ...detail, evidenceVerified };
    }
    result.details = verifiedDetails;
  }

  // Verify conditions
  if (Array.isArray(result.conditions)) {
    result.conditions = result.conditions.map((condition) => {
      if (!condition || typeof condition !== 'object') return condition;

      let evidenceVerified = false;
      if (condition.quotation && condition.page != null) {
        const pageText = pageMap[condition.page] || '';
        const { found } = findQuotationInPage(condition.quotation, pageText);
        evidenceVerified = found;
      }

      return { ...condition, evidenceVerified };
    });
  }

  return result;
}

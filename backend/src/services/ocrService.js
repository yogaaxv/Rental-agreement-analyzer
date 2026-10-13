/**
 * OCR service stub.
 *
 * This module is a placeholder for OCR-based text extraction from scanned PDFs.
 * To enable OCR support, install tesseract.js and implement this function.
 *
 * @param {string} filePath - Absolute path to the scanned PDF file.
 * @returns {Promise<never>} Always throws — OCR is not configured.
 */
export async function extractTextWithOCR(filePath) {
  throw new Error(
    'OCR not configured — install tesseract.js to enable scanned PDF support. ' +
    `Attempted file: ${filePath}`
  );
}

import { readFile } from 'fs/promises';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const require = createRequire(import.meta.url);

/**
 * Extract text from a PDF file, organized by page.
 * Uses pdfjs-dist legacy build in Node.js with the real worker file URL.
 *
 * @param {string} filePath - Absolute path to the PDF file.
 * @returns {Promise<Array<{ pageNumber: number, text: string }>>}
 */
export async function extractTextByPage(filePath) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // Point workerSrc to the actual worker file so pdfjs can load it
  const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const fileBuffer = await readFile(filePath);
  const data = new Uint8Array(fileBuffer);

  let pdfDocument;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    pdfDocument = await loadingTask.promise;
  } catch (err) {
    if (err.name === 'PasswordException') {
      throw new Error('PDF is password-protected and cannot be processed.');
    }
    if (err.name === 'InvalidPDFException') {
      throw new Error('The uploaded file is not a valid PDF.');
    }
    throw new Error(`PDF loading failed: ${err.message}`);
  }

  const numPages = pdfDocument.numPages;
  if (numPages === 0) {
    throw new Error('The PDF has no pages.');
  }

  const pageTexts = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      const text = textContent.items
        .map((item) => (item.hasEOL ? item.str + '\n' : item.str))
        .join(' ')
        .replace(/ +/g, ' ')
        .trim();

      pageTexts.push({ pageNumber: pageNum, text });
    } catch (err) {
      pageTexts.push({ pageNumber: pageNum, text: '' });
    }
  }

  return pageTexts;
}

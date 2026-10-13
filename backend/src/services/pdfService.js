import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extract text from a PDF file, organized by page.
 * Uses pdfjs-dist legacy build with dynamic import to avoid top-level global mutations.
 *
 * @param {string} filePath - Absolute path to the PDF file.
 * @returns {Promise<Array<{ pageNumber: number, text: string }>>}
 */
export async function extractTextByPage(filePath) {
  // Dynamic import — pdfjs-dist 4.x uses named exports (no default export)
  const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const GlobalWorkerOptions = pdfjsModule.GlobalWorkerOptions;
  const getDocument = pdfjsModule.getDocument;

  // Set workerSrc to empty string to suppress the worker warning in Node.js.
  // In Node.js there is no web worker; pdfjs falls back to in-thread processing.
  GlobalWorkerOptions.workerSrc = '';

  const fileBuffer = await readFile(filePath);
  const data = new Uint8Array(fileBuffer);

  const loadingTask = getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  const pageTexts = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Join all text items, preserving line breaks where appropriate
    const text = textContent.items
      .map((item) => {
        if (item.hasEOL) {
          return item.str + '\n';
        }
        return item.str;
      })
      .join(' ')
      .replace(/ +/g, ' ')
      .trim();

    pageTexts.push({ pageNumber: pageNum, text });
  }

  return pageTexts;
}

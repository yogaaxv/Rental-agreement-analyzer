import { readFile } from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
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

  // On Windows, workerSrc must be a file:// URL (plain Windows paths are rejected by the ESM loader)
  const workerPath = path.resolve(
    __dirname,
    '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
  );
  GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

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

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAX_FILE_SIZE_MB = parseFloat(process.env.MAX_FILE_SIZE_MB || '10');
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

// Ensure uploads directory exists
mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Only PDF files are accepted. Please upload a .pdf file.'), {
        status: 400,
      }),
      false
    );
  }
}

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter,
});

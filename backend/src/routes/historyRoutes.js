import { Router } from 'express';
import { unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllAnalyses,
  getAnalysisById,
  deleteAnalysis,
} from '../database/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

const router = Router();

/**
 * GET /api/history
 * Returns a paginated list of analyses.
 * Query params: page (default 1), limit (default 20)
 */
router.get('/', (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { rows, total } = getAllAnalyses(limit, offset);

    return res.status(200).json({
      analyses: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /api/history/:id
 * Delete an analysis and its result from the DB. Also removes the uploaded file.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const analysis = getAnalysisById(id);

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }

    // Attempt to delete uploaded file
    if (analysis.file_path) {
      try {
        await unlink(analysis.file_path);
      } catch {
        // File may have already been deleted — ignore
      }
    }

    deleteAnalysis(id);
    return res.status(200).json({ success: true, id });
  } catch (err) {
    return next(err);
  }
});

export default router;

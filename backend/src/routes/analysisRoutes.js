import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  uploadAndAnalyze,
  getAnalysis,
  getReport,
  getResultJson,
} from '../controllers/analysisController.js';

const router = Router();

// POST /api/analysis — upload PDF and run analysis
router.post('/', upload.single('file'), uploadAndAnalyze);

// GET /api/analysis/:id — fetch analysis result by ID
router.get('/:id', getAnalysis);

// GET /api/analysis/:id/report — stream PDF report
router.get('/:id/report', getReport);

// GET /api/analysis/:id/json — download result as JSON
router.get('/:id/json', getResultJson);

export default router;

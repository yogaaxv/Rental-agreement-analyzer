import { v4 as uuidv4 } from 'uuid';
import {
  insertAnalysis,
  updateAnalysisStatus,
  insertResult,
  getAnalysisById,
  getResultByAnalysisId,
} from '../database/database.js';
import { extractTextByPage } from '../services/pdfService.js';
import { analyzeAgreement } from '../services/llmService.js';
import { enrichClauseResults } from '../services/clauseService.js';
import { verifyEvidence } from '../services/evidenceService.js';
import { generatePDFReport } from '../services/reportService.js';

/**
 * POST /api/analysis
 * Upload a PDF and run the full analysis pipeline.
 */
export async function uploadAndAnalyze(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Please upload a PDF file.' });
  }

  const analysisId = uuidv4();
  const { originalname, size, path: filePath } = req.file;

  // Insert analysis record with 'processing' status
  insertAnalysis({ id: analysisId, filename: originalname, file_path: filePath, file_size: size });

  try {
    // Step 1: Extract text by page
    const pageTexts = await extractTextByPage(filePath);
    const pageCount = pageTexts.length;

    // Update page count
    updateAnalysisStatus(analysisId, 'processing', null, pageCount);

    // Step 2: LLM analysis
    const { result: llmResult, partial, tokensUsed } = await analyzeAgreement(pageTexts, originalname);

    // Step 3: Enrich clause results (ensure all 10 keys present)
    const enrichedClauses = enrichClauseResults(llmResult.clauses || {});
    const enrichedResult = { ...llmResult, clauses: enrichedClauses };

    // Step 4: Verify evidence
    const verifiedResult = verifyEvidence(enrichedResult, pageTexts);

    // Step 5: Store result in DB
    const details = verifiedResult.details || {};
    const resultId = uuidv4();

    insertResult({
      id: resultId,
      analysis_id: analysisId,
      monthly_rent: details.monthly_rent?.value || null,
      security_deposit: details.security_deposit?.value || null,
      start_date: details.start_date?.value || null,
      end_date: details.end_date?.value || null,
      lease_duration: details.lease_duration?.value || null,
      notice_period: details.notice_period?.value || null,
      maintenance: details.maintenance?.value || null,
      rent_escalation: details.rent_escalation?.value || null,
      late_payment: details.late_payment?.value || null,
      early_termination: details.early_termination?.value || null,
      renewal_terms: details.renewal_terms?.value || null,
      utilities: details.utilities?.value || null,
      deposit_refund: details.deposit_refund?.value || null,
      raw_details_json: JSON.stringify(verifiedResult.details),
      clauses_json: JSON.stringify(verifiedResult.clauses),
      conditions_json: JSON.stringify(verifiedResult.conditions || []),
      risk_summary_json: JSON.stringify(verifiedResult.risk_summary || []),
      page_count: pageCount,
    });

    // Step 6: Mark analysis as completed
    updateAnalysisStatus(analysisId, 'completed', null, pageCount);

    return res.status(200).json({
      id: analysisId,
      filename: originalname,
      pageCount,
      partial,
      tokensUsed,
      details: verifiedResult.details,
      clauses: verifiedResult.clauses,
      conditions: verifiedResult.conditions || [],
      risk_summary: verifiedResult.risk_summary || [],
    });
  } catch (err) {
    updateAnalysisStatus(analysisId, 'failed', err.message);
    return next(err);
  }
}

/**
 * GET /api/analysis/:id
 * Fetch a completed analysis by ID.
 */
export async function getAnalysis(req, res, next) {
  try {
    const { id } = req.params;
    const analysis = getAnalysisById(id);

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }

    const dbResult = getResultByAnalysisId(id);

    if (!dbResult) {
      return res.status(200).json({
        id: analysis.id,
        filename: analysis.filename,
        status: analysis.status,
        error_message: analysis.error_message,
        created_at: analysis.created_at,
        completed_at: analysis.completed_at,
      });
    }

    return res.status(200).json({
      id: analysis.id,
      filename: analysis.filename,
      status: analysis.status,
      pageCount: dbResult.page_count,
      created_at: analysis.created_at,
      completed_at: analysis.completed_at,
      details: JSON.parse(dbResult.raw_details_json || '{}'),
      clauses: JSON.parse(dbResult.clauses_json || '{}'),
      conditions: JSON.parse(dbResult.conditions_json || '[]'),
      risk_summary: JSON.parse(dbResult.risk_summary_json || '[]'),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/analysis/:id/report
 * Stream the PDF report, generating it on demand if needed.
 */
export async function getReport(req, res, next) {
  try {
    const { id } = req.params;
    const analysis = getAnalysisById(id);

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }

    const dbResult = getResultByAnalysisId(id);
    if (!dbResult) {
      return res.status(404).json({ error: 'Analysis result not found.' });
    }

    const resultData = {
      details: JSON.parse(dbResult.raw_details_json || '{}'),
      clauses: JSON.parse(dbResult.clauses_json || '{}'),
      conditions: JSON.parse(dbResult.conditions_json || '[]'),
      risk_summary: JSON.parse(dbResult.risk_summary_json || '[]'),
    };

    const reportPath = await generatePDFReport(analysis, resultData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analysis-${id}.pdf"`
    );

    const { createReadStream } = await import('fs');
    const stream = createReadStream(reportPath);
    stream.pipe(res);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/analysis/:id/json
 * Return the raw analysis result as a downloadable JSON file.
 */
export async function getResultJson(req, res, next) {
  try {
    const { id } = req.params;
    const analysis = getAnalysisById(id);

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }

    const dbResult = getResultByAnalysisId(id);
    if (!dbResult) {
      return res.status(404).json({ error: 'Analysis result not found.' });
    }

    const payload = {
      id: analysis.id,
      filename: analysis.filename,
      created_at: analysis.created_at,
      completed_at: analysis.completed_at,
      page_count: dbResult.page_count,
      details: JSON.parse(dbResult.raw_details_json || '{}'),
      clauses: JSON.parse(dbResult.clauses_json || '{}'),
      conditions: JSON.parse(dbResult.conditions_json || '[]'),
      risk_summary: JSON.parse(dbResult.risk_summary_json || '[]'),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analysis-${id}.json"`
    );
    return res.status(200).json(payload);
  } catch (err) {
    return next(err);
  }
}

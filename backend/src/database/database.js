/**
 * Database layer using Node.js built-in node:sqlite (available in Node.js v22.5+).
 * No native build step required — works out of the box with Node.js v24.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_DIR = path.resolve(__dirname, '../../../');
const DB_PATH = path.join(DB_DIR, 'database.sqlite');
const SCHEMA_PATH = path.resolve(__dirname, './schema.sql');

// Ensure the database directory exists
mkdirSync(DB_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better performance
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// Initialize schema
const schema = readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

/**
 * Insert a new analysis record.
 * @param {{ id: string, filename: string, file_path: string, file_size: number }} data
 */
export function insertAnalysis(data) {
  const stmt = db.prepare(
    `INSERT INTO analyses (id, filename, file_path, file_size, status, created_at)
     VALUES (?, ?, ?, ?, 'processing', datetime('now'))`
  );
  return stmt.run(data.id, data.filename, data.file_path, data.file_size);
}

/**
 * Update the status of an analysis.
 * @param {string} id
 * @param {string} status
 * @param {string|null} [error]
 * @param {number|null} [pageCount]
 */
export function updateAnalysisStatus(id, status, error = null, pageCount = null) {
  const isTerminal = status === 'completed' || status === 'failed';
  if (isTerminal) {
    const stmt = db.prepare(
      `UPDATE analyses
       SET status = ?,
           error_message = ?,
           page_count = COALESCE(?, page_count),
           completed_at = datetime('now')
       WHERE id = ?`
    );
    return stmt.run(status, error, pageCount, id);
  } else {
    const stmt = db.prepare(
      `UPDATE analyses
       SET status = ?,
           error_message = ?,
           page_count = COALESCE(?, page_count)
       WHERE id = ?`
    );
    return stmt.run(status, error, pageCount, id);
  }
}

/**
 * Insert analysis results.
 * @param {Object} data
 */
export function insertResult(data) {
  const stmt = db.prepare(
    `INSERT INTO analysis_results (
      id, analysis_id, monthly_rent, security_deposit, start_date, end_date,
      lease_duration, notice_period, maintenance, rent_escalation, late_payment,
      early_termination, renewal_terms, utilities, deposit_refund,
      raw_details_json, clauses_json, conditions_json, risk_summary_json,
      page_count, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, datetime('now')
    )`
  );
  return stmt.run(
    data.id, data.analysis_id,
    data.monthly_rent, data.security_deposit, data.start_date, data.end_date,
    data.lease_duration, data.notice_period, data.maintenance, data.rent_escalation, data.late_payment,
    data.early_termination, data.renewal_terms, data.utilities, data.deposit_refund,
    data.raw_details_json, data.clauses_json, data.conditions_json, data.risk_summary_json,
    data.page_count
  );
}

/**
 * Get an analysis by ID.
 * @param {string} id
 */
export function getAnalysisById(id) {
  return db.prepare('SELECT * FROM analyses WHERE id = ?').get(id);
}

/**
 * Get a result record by analysis ID.
 * @param {string} analysisId
 */
export function getResultByAnalysisId(analysisId) {
  return db.prepare('SELECT * FROM analysis_results WHERE analysis_id = ?').get(analysisId);
}

/**
 * Get all analyses with pagination.
 * @param {number} limit
 * @param {number} offset
 */
export function getAllAnalyses(limit = 20, offset = 0) {
  const rows = db.prepare(
    'SELECT * FROM analyses ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset);
  const countRow = db.prepare('SELECT COUNT(*) as total FROM analyses').get();
  const total = countRow ? Number(countRow.total) : 0;
  return { rows, total };
}

/**
 * Delete an analysis and its result (cascade handles result deletion).
 * @param {string} id
 */
export function deleteAnalysis(id) {
  return db.prepare('DELETE FROM analyses WHERE id = ?').run(id);
}

export default db;

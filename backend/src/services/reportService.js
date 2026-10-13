import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.resolve(__dirname, '../../../reports');

// Ensure reports directory exists
mkdirSync(REPORTS_DIR, { recursive: true });

// Colors
const NAVY = '#1e2a4a';
const BLUE = '#3b82f6';
const GRAY = '#6b7280';
const LIGHT_GRAY = '#f3f4f6';
const RED = '#ef4444';
const YELLOW = '#f59e0b';
const GREEN = '#22c55e';

/**
 * Get a color for clause status.
 */
function clauseStatusColor(status) {
  switch (status) {
    case 'found': return GREEN;
    case 'not_found': return RED;
    case 'needs_review': return YELLOW;
    default: return GRAY;
  }
}

/**
 * Get a color for risk type.
 */
function riskTypeColor(type) {
  switch (type) {
    case 'missing': return RED;
    case 'warning': return YELLOW;
    case 'info': return BLUE;
    default: return GRAY;
  }
}

/**
 * Generate a PDF report for an analysis.
 *
 * @param {{ id: string, filename: string, created_at: string }} analysisData
 * @param {object} result - Full analysis result (details, clauses, conditions, risk_summary).
 * @returns {Promise<string>} Path to the generated PDF file.
 */
export async function generatePDFReport(analysisData, result) {
  const outputPath = path.join(REPORTS_DIR, `${analysisData.id}.pdf`);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = createWriteStream(outputPath);

    doc.pipe(stream);

    // ── Title Page ──────────────────────────────────────────────────────────
    doc
      .fillColor(NAVY)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('Rental Agreement Analysis Report', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor(GRAY)
      .text(`File: ${analysisData.filename}`, { align: 'center' });

    doc.moveDown(0.3);
    const dateStr = analysisData.created_at
      ? new Date(analysisData.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : new Date().toLocaleDateString();
    doc.text(`Generated: ${dateStr}`, { align: 'center' });

    doc.moveDown(1);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor(BLUE)
      .lineWidth(2)
      .stroke();
    doc.moveDown(1);

    // ── Summary Cards ────────────────────────────────────────────────────────
    doc
      .fillColor(NAVY)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Agreement Summary');
    doc.moveDown(0.5);

    const details = result.details || {};
    const summaryFields = [
      { label: 'Monthly Rent', key: 'monthly_rent' },
      { label: 'Security Deposit', key: 'security_deposit' },
      { label: 'Lease Duration', key: 'lease_duration' },
      { label: 'Notice Period', key: 'notice_period' },
    ];

    for (const { label, key } of summaryFields) {
      const val = details[key]?.value || 'Not Found';
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(GRAY)
        .text(label.toUpperCase(), { continued: true })
        .font('Helvetica')
        .fillColor(NAVY)
        .text(`  ${val}`);
    }

    doc.moveDown(1);

    // ── Agreement Details ─────────────────────────────────────────────────────
    doc
      .fillColor(NAVY)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Agreement Details');
    doc.moveDown(0.5);

    const detailFields = [
      { label: 'Monthly Rent', key: 'monthly_rent' },
      { label: 'Security Deposit', key: 'security_deposit' },
      { label: 'Start Date', key: 'start_date' },
      { label: 'End Date', key: 'end_date' },
      { label: 'Lease Duration', key: 'lease_duration' },
      { label: 'Notice Period', key: 'notice_period' },
      { label: 'Maintenance', key: 'maintenance' },
      { label: 'Rent Escalation', key: 'rent_escalation' },
      { label: 'Late Payment', key: 'late_payment' },
      { label: 'Early Termination', key: 'early_termination' },
      { label: 'Renewal Terms', key: 'renewal_terms' },
      { label: 'Utilities', key: 'utilities' },
      { label: 'Deposit Refund', key: 'deposit_refund' },
    ];

    for (const { label, key } of detailFields) {
      const field = details[key];
      const val = field?.value || 'Not Found';
      const page = field?.page ? ` (Page ${field.page})` : '';
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(GRAY)
        .text(`${label}:`, { continued: true })
        .font('Helvetica')
        .fillColor(NAVY)
        .text(`  ${val}${page}`);

      if (field?.quotation) {
        doc
          .fontSize(9)
          .fillColor(GRAY)
          .font('Helvetica-Oblique')
          .text(`  "${field.quotation}"`, { indent: 20 });
      }
      doc.moveDown(0.2);
    }

    doc.moveDown(0.8);

    // ── Clause Checklist ──────────────────────────────────────────────────────
    // Add new page if close to bottom
    if (doc.y > 650) doc.addPage();

    doc
      .fillColor(NAVY)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Clause Checklist');
    doc.moveDown(0.5);

    const clauses = result.clauses || {};
    for (const [key, clause] of Object.entries(clauses)) {
      const displayName = clause.displayName || key.replace(/_/g, ' ');
      const status = clause.status || 'not_found';
      const statusLabel = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const color = clauseStatusColor(status);

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(NAVY)
        .text(`${displayName}:  `, { continued: true })
        .fillColor(color)
        .font('Helvetica-Bold')
        .text(statusLabel);

      if (clause.note) {
        doc.font('Helvetica').fillColor(GRAY).fontSize(9).text(`  ${clause.note}`, { indent: 20 });
      }
      doc.moveDown(0.2);
    }

    doc.moveDown(0.8);

    // ── Important Conditions ──────────────────────────────────────────────────
    if (doc.y > 600) doc.addPage();

    doc
      .fillColor(NAVY)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Important Conditions');
    doc.moveDown(0.5);

    const conditions = result.conditions || [];
    if (conditions.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(GRAY).text('No important conditions identified.');
    } else {
      for (const condition of conditions) {
        if (doc.y > 680) doc.addPage();

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor(NAVY)
          .text(condition.title || 'Condition');
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(GRAY)
          .text(condition.explanation || '', { indent: 10 });

        if (condition.quotation) {
          doc
            .font('Helvetica-Oblique')
            .fontSize(9)
            .fillColor(BLUE)
            .text(`"${condition.quotation}"`, { indent: 10 });
        }
        if (condition.page) {
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(GRAY)
            .text(`Page ${condition.page}`, { indent: 10 });
        }
        doc.moveDown(0.5);
      }
    }

    doc.moveDown(0.8);

    // ── Risk Summary ──────────────────────────────────────────────────────────
    if (doc.y > 600) doc.addPage();

    doc
      .fillColor(NAVY)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Risk Summary');
    doc.moveDown(0.5);

    const riskSummary = result.risk_summary || [];
    if (riskSummary.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(GRAY).text('No risk items identified.');
    } else {
      for (const item of riskSummary) {
        const color = riskTypeColor(item.type);
        const typeLabel = (item.type || 'info').toUpperCase();
        doc
          .fillColor(color)
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(`[${typeLabel}] `, { continued: true })
          .fillColor(NAVY)
          .font('Helvetica')
          .text(item.message || '');
        doc.moveDown(0.3);
      }
    }

    doc.moveDown(1.5);

    // ── Footer / Disclaimer ───────────────────────────────────────────────────
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor(LIGHT_GRAY)
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.5);

    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor(GRAY)
      .text(
        'Disclaimer: This report is generated by an AI-based analysis tool and is intended for informational purposes only. ' +
        'It does not constitute legal advice or determine the legal validity of any rental agreement. ' +
        'Always consult a qualified legal professional before making decisions based on this analysis.',
        { align: 'center' }
      );

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

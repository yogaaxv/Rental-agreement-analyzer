import { useState } from 'react';
import { Download, FileJson, Info } from 'lucide-react';
import { getReportUrl, getJsonUrl } from '../services/api.js';
import './ReportActions.css';

/**
 * ReportActions — download PDF report and JSON buttons.
 * @param {object} props
 * @param {string} props.analysisId
 */
export default function ReportActions({ analysisId }) {
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonError, setJsonError] = useState(null);

  async function handleDownloadJson() {
    setJsonLoading(true);
    setJsonError(null);
    try {
      const url = getJsonUrl(analysisId);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download JSON: ${response.statusText}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `analysis-${analysisId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setJsonError(err.message || 'Failed to download JSON.');
    } finally {
      setJsonLoading(false);
    }
  }

  return (
    <section className="report-actions" aria-labelledby="report-actions-heading">
      <h2 id="report-actions-heading" className="section-title">Download Report</h2>
      <div className="report-buttons">
        <a
          href={getReportUrl(analysisId)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary report-btn"
          aria-label="Download PDF report (opens in new tab)"
        >
          <Download size={18} aria-hidden="true" />
          Download PDF Report
        </a>
        <button
          type="button"
          className="btn-secondary report-btn"
          onClick={handleDownloadJson}
          disabled={jsonLoading}
          aria-label="Download analysis as JSON file"
        >
          {jsonLoading ? (
            <span className="spinner" aria-label="Downloading..." />
          ) : (
            <FileJson size={18} aria-hidden="true" />
          )}
          Download JSON
        </button>
      </div>
      {jsonError && (
        <p className="report-error" role="alert">{jsonError}</p>
      )}
      <div className="report-disclaimer" role="note">
        <Info size={14} aria-hidden="true" className="disclaimer-icon" />
        <p>
          This analysis is for informational purposes only and does not constitute legal advice.
          Always consult a qualified professional before signing or disputing a rental agreement.
        </p>
      </div>
    </section>
  );
}

import { Quote, CheckCircle, AlertCircle } from 'lucide-react';
import './EvidenceViewer.css';

/**
 * EvidenceViewer — displays a supporting quotation with page reference.
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.quotation
 * @param {number} props.page
 * @param {boolean} [props.verified]
 */
export default function EvidenceViewer({ title, quotation, page, verified }) {
  if (!quotation) return null;

  return (
    <div className="evidence-viewer" role="region" aria-label={`Evidence for ${title || 'this field'}`}>
      <div className="evidence-header">
        <Quote size={14} aria-hidden="true" className="evidence-quote-icon" />
        <span className="evidence-label">Supporting Evidence</span>
        <div className="evidence-chips">
          {page && (
            <span className="page-badge">Page {page}</span>
          )}
          <span
            className={`status-chip ${verified ? 'evidence-verified' : 'evidence-unverified'}`}
            aria-label={verified ? 'Evidence verified in document' : 'Evidence could not be verified'}
          >
            {verified ? (
              <CheckCircle size={12} aria-hidden="true" />
            ) : (
              <AlertCircle size={12} aria-hidden="true" />
            )}
            {verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
      </div>
      <blockquote className="evidence-blockquote">
        <p className="evidence-text">&#8220;{quotation}&#8221;</p>
      </blockquote>
    </div>
  );
}

import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import './RiskSummary.css';

function RiskIcon({ type }) {
  if (type === 'missing') return <AlertCircle size={18} className="risk-icon-missing" aria-hidden="true" />;
  if (type === 'warning') return <AlertTriangle size={18} className="risk-icon-warning" aria-hidden="true" />;
  return <Info size={18} className="risk-icon-info" aria-hidden="true" />;
}

/**
 * RiskSummary — risk items and missing clause count.
 * @param {object} props
 * @param {Array} props.riskSummary - Array of { type, message }
 * @param {object} props.clauses - Clauses object (to count not_found)
 */
export default function RiskSummary({ riskSummary, clauses }) {
  const riskItems = Array.isArray(riskSummary) ? riskSummary : [];
  const notFoundCount = clauses
    ? Object.values(clauses).filter((c) => c?.status === 'not_found').length
    : 0;

  return (
    <section className="risk-summary" aria-labelledby="risk-summary-heading">
      <h2 id="risk-summary-heading" className="section-title">Risk Summary &amp; Missing Clauses</h2>

      {riskItems.length > 0 ? (
        <ul className="risk-list" aria-label="Risk summary items">
          {riskItems.map((item, index) => (
            <li key={index} className={`risk-item risk-item-${item.type}`}>
              <RiskIcon type={item.type} />
              <p className="risk-message">{item.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="risk-empty">No specific risk items identified in this analysis.</p>
      )}

      {notFoundCount > 0 && (
        <div className="missing-clauses-note" role="note">
          <XCircle size={18} aria-hidden="true" className="missing-icon" />
          <div>
            <p className="missing-count">
              <strong>{notFoundCount}</strong> standard{' '}
              {notFoundCount === 1 ? 'clause was' : 'clauses were'} not found in this agreement.
            </p>
            <p className="missing-advice">
              Missing clauses should be reviewed with a qualified professional before signing.
              This analysis is for informational purposes only.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

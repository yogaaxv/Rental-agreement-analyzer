import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import EvidenceViewer from './EvidenceViewer.jsx';
import './AgreementDetails.css';

const DETAIL_FIELDS = [
  { key: 'monthly_rent', label: 'Monthly Rent' },
  { key: 'security_deposit', label: 'Security Deposit' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'end_date', label: 'End Date' },
  { key: 'lease_duration', label: 'Lease Duration' },
  { key: 'notice_period', label: 'Notice Period' },
  { key: 'maintenance', label: 'Maintenance Responsibilities' },
  { key: 'rent_escalation', label: 'Rent Escalation' },
  { key: 'late_payment', label: 'Late Payment Conditions' },
  { key: 'early_termination', label: 'Early Termination' },
  { key: 'renewal_terms', label: 'Renewal Terms' },
  { key: 'utilities', label: 'Utility Responsibilities' },
  { key: 'deposit_refund', label: 'Deposit Refund Conditions' },
];

function DetailRow({ field, data }) {
  const [expanded, setExpanded] = useState(false);
  const { key, label } = field;
  const item = data?.[key];
  const value = item?.value;
  const hasValue = value && value.toLowerCase() !== 'not found';
  const hasEvidence = item?.quotation;

  return (
    <>
      <tr className={`detail-row ${expanded ? 'detail-row-expanded' : ''}`}>
        <td className="detail-cell detail-label">{label}</td>
        <td className={`detail-cell detail-value ${!hasValue ? 'detail-not-found' : ''}`}>
          {hasValue ? value : 'Not Found'}
        </td>
        <td className="detail-cell detail-page">
          {item?.page ? (
            <span className="page-badge">Page {item.page}</span>
          ) : (
            <span className="detail-no-page">—</span>
          )}
        </td>
        <td className="detail-cell detail-actions">
          {hasEvidence ? (
            <button
              className="evidence-toggle-btn"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={`${expanded ? 'Hide' : 'View'} evidence for ${label}`}
            >
              {expanded ? (
                <>
                  <ChevronUp size={14} aria-hidden="true" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <ChevronDown size={14} aria-hidden="true" />
                  <span>View Evidence</span>
                </>
              )}
            </button>
          ) : (
            <span className="detail-no-evidence">No evidence</span>
          )}
        </td>
      </tr>
      {expanded && hasEvidence && (
        <tr className="evidence-row">
          <td colSpan={4} className="evidence-cell">
            <EvidenceViewer
              title={label}
              quotation={item.quotation}
              page={item.page}
              verified={item.evidenceVerified}
            />
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * AgreementDetails — table of all extracted rental agreement fields.
 * @param {object} props
 * @param {object} props.details - Details object from API
 */
export default function AgreementDetails({ details }) {
  return (
    <section className="agreement-details" aria-labelledby="agreement-details-heading">
      <h2 id="agreement-details-heading" className="section-title">Agreement Details</h2>
      <div className="details-table-wrapper">
        <table className="details-table">
          <thead>
            <tr>
              <th scope="col" className="th-label">Field</th>
              <th scope="col" className="th-value">Extracted Value</th>
              <th scope="col" className="th-page">Page</th>
              <th scope="col" className="th-actions">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {DETAIL_FIELDS.map((field) => (
              <DetailRow key={field.key} field={field} data={details} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

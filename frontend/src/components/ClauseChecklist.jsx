import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import './ClauseChecklist.css';

const CLAUSE_DISPLAY_NAMES = {
  rent_payment: 'Rent and Payment Terms',
  security_deposit: 'Security Deposit',
  lease_duration: 'Lease Duration',
  notice_termination: 'Notice and Termination',
  maintenance_repairs: 'Maintenance and Repairs',
  utilities: 'Utilities',
  rent_escalation: 'Rent Escalation',
  renewal: 'Renewal',
  property_damage: 'Property Damage and Deductions',
  signatures_dates: 'Signatures and Dates',
};

function StatusBadge({ status }) {
  if (status === 'found') {
    return (
      <span className="badge-found" aria-label="Clause found">
        <CheckCircle size={13} aria-hidden="true" />
        Found
      </span>
    );
  }
  if (status === 'needs_review') {
    return (
      <span className="badge-review" aria-label="Clause needs review">
        <AlertTriangle size={13} aria-hidden="true" />
        Needs Review
      </span>
    );
  }
  return (
    <span className="badge-not-found" aria-label="Clause not found">
      <XCircle size={13} aria-hidden="true" />
      Not Found
    </span>
  );
}

/**
 * ClauseChecklist — grid of expected rental agreement clauses with statuses.
 * @param {object} props
 * @param {object} props.clauses - Clauses object from API
 */
export default function ClauseChecklist({ clauses }) {
  const entries = Object.entries(CLAUSE_DISPLAY_NAMES);

  return (
    <section className="clause-checklist" aria-labelledby="clause-checklist-heading">
      <h2 id="clause-checklist-heading" className="section-title">Clause Checklist</h2>
      <p className="section-subtitle">
        Standard rental agreement clauses and whether they were identified in your document.
      </p>
      <ul className="clause-grid" aria-label="Clause checklist">
        {entries.map(([key, displayName]) => {
          const clause = clauses?.[key];
          const status = clause?.status || 'not_found';
          const page = clause?.page;
          const note = clause?.note;

          return (
            <li key={key} className={`clause-card clause-card-${status}`}>
              <div className="clause-card-header">
                <span className="clause-name">{displayName}</span>
                <StatusBadge status={status} />
              </div>
              {(page || note) && (
                <div className="clause-card-footer">
                  {page && (
                    <span className="page-badge clause-page">Page {page}</span>
                  )}
                  {note && (
                    <p className="clause-note">{note}</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

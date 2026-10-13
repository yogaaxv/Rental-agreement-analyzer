import { DollarSign, Shield, Calendar, Clock } from 'lucide-react';
import './SummaryCards.css';

const CARDS = [
  {
    key: 'monthly_rent',
    label: 'Monthly Rent',
    Icon: DollarSign,
    color: 'blue',
  },
  {
    key: 'security_deposit',
    label: 'Security Deposit',
    Icon: Shield,
    color: 'indigo',
  },
  {
    key: 'lease_duration',
    label: 'Lease Duration',
    Icon: Calendar,
    color: 'navy',
  },
  {
    key: 'notice_period',
    label: 'Notice Period',
    Icon: Clock,
    color: 'teal',
  },
];

/**
 * SummaryCards — 4-card grid for key agreement highlights.
 * @param {object} props
 * @param {object} props.details - Agreement details object from API
 */
export default function SummaryCards({ details }) {
  return (
    <div className="summary-cards" role="list" aria-label="Agreement summary">
      {CARDS.map(({ key, label, Icon, color }) => {
        const field = details?.[key];
        const value = field?.value;
        const hasValue = value && value.toLowerCase() !== 'not found';

        return (
          <div key={key} className={`summary-card summary-card-${color}`} role="listitem">
            <div className="summary-card-icon" aria-hidden="true">
              <Icon size={22} />
            </div>
            <div className="summary-card-content">
              <p className="summary-card-label">{label}</p>
              <p className={`summary-card-value ${!hasValue ? 'summary-card-not-found' : ''}`}>
                {hasValue ? value : 'Not Found'}
              </p>
              {field?.page && hasValue && (
                <p className="summary-card-page">Page {field.page}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

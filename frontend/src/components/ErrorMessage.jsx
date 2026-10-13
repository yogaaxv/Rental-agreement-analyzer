import { AlertCircle, X } from 'lucide-react';
import './ErrorMessage.css';

/**
 * ErrorMessage component
 * @param {object} props
 * @param {string|object} props.error - Error string or { message } object
 * @param {function} [props.onDismiss] - Optional dismiss handler
 */
export default function ErrorMessage({ error, onDismiss }) {
  if (!error) return null;

  const message =
    typeof error === 'string'
      ? error
      : error?.message || 'An unexpected error occurred. Please try again.';

  return (
    <div className="error-message" role="alert" aria-live="assertive">
      <div className="error-message-content">
        <AlertCircle size={20} className="error-icon" aria-hidden="true" />
        <p className="error-text">{message}</p>
      </div>
      {onDismiss && (
        <button
          className="error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

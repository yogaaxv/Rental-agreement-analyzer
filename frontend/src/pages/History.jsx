import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, Eye, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { getHistory, deleteAnalysis } from '../services/api.js';
import './History.css';

const PAGE_LIMIT = 20;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function StatusChip({ status }) {
  const classMap = {
    completed: 'status-chip status-chip-completed',
    processing: 'status-chip status-chip-processing',
    failed: 'status-chip status-chip-failed',
  };
  return (
    <span className={classMap[status] || 'status-chip'}>
      {status || 'unknown'}
    </span>
  );
}

export default function History() {
  const [analyses, setAnalyses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const fetchHistory = useCallback(
    async (pageNum) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getHistory(pageNum, PAGE_LIMIT);
        setAnalyses(data.analyses || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err.message || 'Failed to load history. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchHistory(page);
  }, [fetchHistory, page]);

  async function handleDelete(id, filename) {
    const confirmed = window.confirm(
      `Delete analysis for "${filename}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message || 'Failed to delete analysis.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="history-page page-content" id="main-content">
      <div className="history-header">
        <h1 className="history-title">Analysis History</h1>
        <p className="history-subtitle">
          Your previously analyzed rental agreements.
        </p>
      </div>

      {error && (
        <ErrorMessage error={error} onDismiss={() => setError(null)} />
      )}

      {loading ? (
        <div className="history-loading" aria-live="polite" aria-label="Loading history">
          <div className="loading-spinner-large" aria-hidden="true" />
          <p>Loading history...</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="history-empty" role="status">
          <div className="history-empty-icon" aria-hidden="true">
            <Clock size={48} />
          </div>
          <h2 className="history-empty-title">No analyses yet</h2>
          <p className="history-empty-desc">
            Upload a rental agreement to get started.
          </p>
          <Link to="/" className="btn-primary" aria-label="Go to home and upload a PDF">
            Upload a Rental Agreement
          </Link>
        </div>
      ) : (
        <>
          <p className="history-count" aria-live="polite">
            {total} {total === 1 ? 'analysis' : 'analyses'} total
          </p>
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th scope="col">Filename</th>
                  <th scope="col">Date Analyzed</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((analysis) => (
                  <tr key={analysis.id} className="history-row">
                    <td className="history-cell">
                      <div className="history-file">
                        <FileText size={16} aria-hidden="true" className="history-file-icon" />
                        <span className="history-filename">{analysis.filename || 'Unknown file'}</span>
                      </div>
                    </td>
                    <td className="history-cell history-date">
                      {formatDate(analysis.completed_at || analysis.created_at)}
                    </td>
                    <td className="history-cell">
                      <StatusChip status={analysis.status} />
                    </td>
                    <td className="history-cell history-actions-cell">
                      <div className="history-actions">
                        {analysis.status === 'completed' && (
                          <Link
                            to={`/analysis/${analysis.id}`}
                            className="btn-secondary history-action-btn"
                            aria-label={`View analysis for ${analysis.filename}`}
                          >
                            <Eye size={15} aria-hidden="true" />
                            View
                          </Link>
                        )}
                        <button
                          type="button"
                          className="history-delete-btn"
                          onClick={() => handleDelete(analysis.id, analysis.filename)}
                          disabled={deletingId === analysis.id}
                          aria-label={`Delete analysis for ${analysis.filename}`}
                        >
                          {deletingId === analysis.id ? (
                            <span className="spinner" aria-label="Deleting..." />
                          ) : (
                            <Trash2 size={15} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="History pagination">
              <button
                type="button"
                className="btn-secondary pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Previous
              </button>
              <span className="pagination-info" aria-current="page">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                Next
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}

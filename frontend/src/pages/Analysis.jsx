import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar } from 'lucide-react';
import SummaryCards from '../components/SummaryCards.jsx';
import AgreementDetails from '../components/AgreementDetails.jsx';
import ClauseChecklist from '../components/ClauseChecklist.jsx';
import EvidenceViewer from '../components/EvidenceViewer.jsx';
import RiskSummary from '../components/RiskSummary.jsx';
import ReportActions from '../components/ReportActions.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { getAnalysis } from '../services/api.js';
import './Analysis.css';

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown date';
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getCategoryLabel(category) {
  const map = {
    financial: 'Financial',
    notice: 'Notice',
    termination: 'Termination',
    maintenance: 'Maintenance',
    other: 'Other',
  };
  return map[category] || category || 'Condition';
}

export default function Analysis() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getAnalysis(id)
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load analysis. Please try again.');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="analysis-page page-content" id="main-content">
        <div className="analysis-loading" aria-live="polite" aria-label="Loading analysis">
          <div className="loading-spinner-large" aria-hidden="true" />
          <p>Loading analysis...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="analysis-page page-content" id="main-content">
        <Link to="/" className="back-link" aria-label="Back to home">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Home
        </Link>
        <ErrorMessage error={error} />
      </main>
    );
  }

  if (!result) return null;

  const conditions = Array.isArray(result.conditions) ? result.conditions : [];

  return (
    <main className="analysis-page page-content" id="main-content">
      {/* Back link */}
      <Link to="/" className="back-link" aria-label="Back to home page">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Home
      </Link>

      {/* Page header */}
      <header className="analysis-header card">
        <div className="analysis-header-icon" aria-hidden="true">
          <FileText size={32} />
        </div>
        <div className="analysis-header-info">
          <h1 className="analysis-filename">{result.filename || 'Rental Agreement'}</h1>
          <div className="analysis-meta">
            {result.completed_at && (
              <span className="analysis-date">
                <Calendar size={14} aria-hidden="true" />
                Analyzed {formatDate(result.completed_at)}
              </span>
            )}
            {result.pageCount && (
              <span className="analysis-pages">{result.pageCount} pages</span>
            )}
          </div>
        </div>
      </header>

      {/* 1. Summary Cards */}
      <SummaryCards details={result.details} />

      {/* 2. Agreement Details */}
      <AgreementDetails details={result.details} />

      {/* 3. Clause Checklist */}
      <ClauseChecklist clauses={result.clauses} />

      {/* 4. Important Conditions */}
      {conditions.length > 0 && (
        <section className="conditions-section" aria-labelledby="conditions-heading">
          <h2 id="conditions-heading" className="section-title">Important Conditions</h2>
          <p className="section-subtitle">
            Key conditions identified in the agreement that you should be aware of.
          </p>
          <div className="conditions-list">
            {conditions.map((condition, index) => (
              <article
                key={index}
                className="condition-card card"
                aria-label={`Condition: ${condition.title}`}
              >
                <div className="condition-header">
                  <h3 className="condition-title">{condition.title}</h3>
                  {condition.category && (
                    <span className="condition-category">
                      {getCategoryLabel(condition.category)}
                    </span>
                  )}
                </div>
                <p className="condition-explanation">{condition.explanation}</p>
                {condition.quotation && (
                  <EvidenceViewer
                    title={condition.title}
                    quotation={condition.quotation}
                    page={condition.page}
                    verified={condition.evidenceVerified}
                  />
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 5. Risk Summary */}
      <RiskSummary riskSummary={result.risk_summary} clauses={result.clauses} />

      {/* 6. Report Actions */}
      <ReportActions analysisId={id} />
    </main>
  );
}

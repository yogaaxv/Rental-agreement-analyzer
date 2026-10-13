import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import UploadSection from '../components/UploadSection.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { uploadAndAnalyze } from '../services/api.js';
import './Home.css';


const MAX_FILE_SIZE_MB = 10;
const STAGE_INTERVAL_MS = 4000;

export default function Home() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(1);
  const navigate = useNavigate();
  const stageTimerRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, []);

  function startStageTimer() {
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    // Stages 2-6 advance every 4 seconds
    stageTimerRef.current = setInterval(() => {
      setStage((prev) => {
        if (prev >= 6) {
          clearInterval(stageTimerRef.current);
          return 6;
        }
        return prev + 1;
      });
    }, STAGE_INTERVAL_MS);
  }

  function stopStageTimer() {
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
  }

  async function handleAnalyze() {
    setError(null);

    if (!file) {
      setError('Please select a PDF file to analyze.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }

    if (file.size === 0) {
      setError('The selected file is empty. Please choose a valid PDF.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds the ${MAX_FILE_SIZE_MB} MB limit.`);
      return;
    }

    setLoading(true);
    setStage(1);

    try {
      const result = await uploadAndAnalyze(file, (progressEvent) => {
        if (progressEvent.loaded >= progressEvent.total && progressEvent.total > 0) {
          // Upload complete — advance to stage 2 and start the stage timer
          setStage(2);
          startStageTimer();
        }
      });

      stopStageTimer();
      navigate(`/analysis/${result.id}`);
    } catch (err) {
      stopStageTimer();
      setLoading(false);
      setStage(1);
      setError(err.message || 'Analysis failed. Please try again.');
    }
  }

  return (
    <main className="home-page page-content" id="main-content">
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-heading">
        <h1 id="hero-heading" className="hero-title">
          Understand Your Rental Agreement in Minutes
        </h1>
        <p className="hero-description">
          Upload your rental agreement PDF and our AI will extract key terms, identify important
          conditions, and flag potentially missing clauses — all with page-level references and
          supporting quotations from the original document.
        </p>
      </section>

      {/* Upload / Loading */}
      <section className="upload-area card" aria-labelledby="upload-heading">
        <h2 id="upload-heading" className="upload-heading">
          {loading ? 'Analyzing Your Document' : 'Upload Your Rental Agreement'}
        </h2>

        {loading ? (
          <LoadingState stage={stage} />
        ) : (
          <>
            <UploadSection file={file} setFile={setFile} error={null} />

            {error && (
              <ErrorMessage error={error} onDismiss={() => setError(null)} />
            )}

            <div className="upload-actions">
              <button
                type="button"
                className="btn-primary analyze-btn"
                onClick={handleAnalyze}
                disabled={!file || loading}
                aria-label="Analyze the selected rental agreement PDF"
              >
                <Search size={18} aria-hidden="true" />
                Analyze Agreement
              </button>
            </div>
          </>
        )}
      </section>

      {/* How it works */}
      {!loading && (
        <section className="how-it-works" aria-labelledby="how-heading">
          <h2 id="how-heading" className="section-title how-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number" aria-hidden="true">1</div>
              <div className="step-icon" aria-hidden="true">
                <FileText size={28} />
              </div>
              <h3 className="step-title">Upload</h3>
              <p className="step-desc">
                Drag and drop your rental agreement PDF or click to browse. Supports files up to{' '}
                {MAX_FILE_SIZE_MB} MB.
              </p>
            </div>
            <div className="step-arrow" aria-hidden="true">
              <ArrowRight size={24} />
            </div>
            <div className="step-card">
              <div className="step-number" aria-hidden="true">2</div>
              <div className="step-icon" aria-hidden="true">
                <Search size={28} />
              </div>
              <h3 className="step-title">Analyze</h3>
              <p className="step-desc">
                Our AI extracts key rental terms, identifies important conditions, and checks for
                standard clauses — all referenced to exact pages.
              </p>
            </div>
            <div className="step-arrow" aria-hidden="true">
              <ArrowRight size={24} />
            </div>
            <div className="step-card">
              <div className="step-number" aria-hidden="true">3</div>
              <div className="step-icon" aria-hidden="true">
                <CheckCircle size={28} />
              </div>
              <h3 className="step-title">Review</h3>
              <p className="step-desc">
                Browse the structured report, review flagged conditions, and download a summary PDF
                for your records.
              </p>
            </div>
          </div>
          <p className="how-disclaimer">
            This tool is for informational purposes only and does not provide legal advice.
          </p>
        </section>
      )}
    </main>
  );
}

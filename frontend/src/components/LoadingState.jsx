import { Check, Loader } from 'lucide-react';
import './LoadingState.css';

const STAGES = [
  'Uploading document',
  'Extracting PDF text',
  'Identifying rental conditions',
  'Checking expected clauses',
  'Verifying evidence and page references',
  'Preparing the report',
];

/**
 * LoadingState component — shows a vertical stepper for analysis stages.
 * @param {object} props
 * @param {number} props.stage - Current stage (1–6)
 */
export default function LoadingState({ stage }) {
  return (
    <div className="loading-state" aria-live="polite" aria-label="Analysis in progress">
      <div className="loading-header">
        <div className="loading-spinner-large" aria-hidden="true" />
        <div>
          <h2 className="loading-title">Analyzing Your Agreement</h2>
          <p className="loading-subtitle">Please wait while we process your document.</p>
        </div>
      </div>

      <ol className="stage-list" aria-label="Processing stages">
        {STAGES.map((label, index) => {
          const stageNum = index + 1;
          const isCompleted = stageNum < stage;
          const isCurrent = stageNum === stage;
          const isPending = stageNum > stage;

          return (
            <li
              key={stageNum}
              className={`stage-item ${isCompleted ? 'stage-completed' : ''} ${isCurrent ? 'stage-current' : ''} ${isPending ? 'stage-pending' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="stage-icon" aria-hidden="true">
                {isCompleted && <Check size={14} strokeWidth={3} />}
                {isCurrent && <Loader size={14} className="stage-spinner" />}
                {isPending && <span className="stage-dot" />}
              </span>
              <span className="stage-label">{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

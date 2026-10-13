import { useRef, useState } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import './UploadSection.css';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * UploadSection — drag-and-drop PDF upload area.
 * @param {object} props
 * @param {File|null} props.file
 * @param {function} props.setFile
 * @param {string|null} props.error
 */
export default function UploadSection({ file, setFile, error }) {
  const [dragOver, setDragOver] = useState(false);
  const [inlineError, setInlineError] = useState(null);
  const inputRef = useRef(null);

  function validateAndSetFile(f) {
    setInlineError(null);
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setInlineError('Only PDF files are supported. Please select a .pdf file.');
      setFile(null);
      return;
    }
    if (f.size === 0) {
      setInlineError('The selected file is empty. Please choose a valid PDF.');
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setInlineError(`File exceeds the ${MAX_FILE_SIZE_MB} MB limit. Please choose a smaller file.`);
      setFile(null);
      return;
    }
    setFile(f);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    validateAndSetFile(dropped);
  }

  function handleInputChange(e) {
    validateAndSetFile(e.target.files[0]);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }

  function handleClear() {
    setFile(null);
    setInlineError(null);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  const displayError = inlineError || error;

  return (
    <div className="upload-section">
      {!file ? (
        <div
          className={`drop-zone ${dragOver ? 'drop-zone-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Upload PDF file — click or drag and drop"
        >
          <div className="drop-zone-icon" aria-hidden="true">
            <Upload size={36} />
          </div>
          <p className="drop-zone-title">Drag &amp; drop your PDF here</p>
          <p className="drop-zone-hint">or</p>
          <button
            type="button"
            className="btn-secondary browse-btn"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            aria-label="Browse and select PDF file"
          >
            Browse Files
          </button>
          <p className="drop-zone-meta">Supported: PDF &bull; Max {MAX_FILE_SIZE_MB} MB</p>
        </div>
      ) : (
        <div className="file-selected">
          <div className="file-info">
            <div className="file-icon" aria-hidden="true">
              <File size={28} />
            </div>
            <div className="file-details">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            className="file-remove"
            onClick={handleClear}
            aria-label={`Remove ${file.name}`}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleInputChange}
        className="file-input-hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {displayError && (
        <div className="upload-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}

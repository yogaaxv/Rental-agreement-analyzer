# Rental Agreement Analyzer

An AI-powered web application that analyzes rental agreement PDFs and extracts key details, identifies important conditions, detects missing clauses, and provides page-level evidence references.

> **Disclaimer:** This tool is for informational purposes only. It does not provide legal advice or determine the legal validity of any rental agreement.

---

## Project Overview

Upload a rental agreement PDF and let the AI do the reading for you. The application:

- Extracts rent, security deposit, lease dates, notice period, and 10+ additional fields
- Shows a clause checklist (Found / Not Found / Needs Review) for 10 standard rental topics
- Highlights important conditions with exact quotations and PDF page numbers
- Provides a risk summary with severity indicators
- Lets you download a formatted PDF report or raw JSON result
- Stores all past analyses in a local SQLite database for easy history browsing

The full pipeline runs locally on Node.js — only the LLM call goes to an external API.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or later (v24 recommended) |
| npm | 8 or later |
| OpenAI-compatible API key | Any OpenAI-compatible provider |
| Windows Build Tools | Required for `better-sqlite3` on Windows |

### Installing Windows Build Tools

`better-sqlite3` compiles a native C++ addon. On Windows you need either:

**Option A — npm global install (older Node versions):**
```bash
npm install --global windows-build-tools
```

**Option B — Visual Studio Build Tools (recommended for Node 18+):**
Download and install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and select the **"Desktop development with C++"** workload.

After installing build tools, also ensure `node-gyp` is available:
```bash
npm install --global node-gyp
```

---

## Project Structure

```
rental-agreement-analyzer/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── app.js              # Express app setup (CORS, helmet, routes)
│   │   ├── server.js           # Entry point — starts HTTP server
│   │   ├── controllers/
│   │   │   └── analysisController.js   # Upload, analyze, retrieve, download
│   │   ├── routes/
│   │   │   ├── analysisRoutes.js       # /api/analysis routes
│   │   │   └── historyRoutes.js        # /api/history routes
│   │   ├── services/
│   │   │   ├── pdfService.js           # pdfjs-dist text extraction with page refs
│   │   │   ├── ocrService.js           # OCR fallback for scanned PDFs
│   │   │   ├── llmService.js           # OpenAI-compatible API + Zod validation
│   │   │   ├── clauseService.js        # Clause presence detection
│   │   │   ├── evidenceService.js      # Evidence matching and quotation extraction
│   │   │   └── reportService.js        # PDFKit report generation
│   │   ├── schemas/
│   │   │   └── analysisSchema.js       # Zod schemas for LLM output + HTTP input
│   │   ├── database/
│   │   │   ├── database.js             # better-sqlite3 initialization
│   │   │   └── schema.sql              # Table definitions
│   │   ├── middleware/
│   │   │   ├── errorHandler.js         # Global Express error handler
│   │   │   └── uploadMiddleware.js     # Multer PDF upload config
│   │   └── utils/
│   │       └── textUtils.js            # Text cleaning helpers
│   ├── uploads/                # Uploaded PDFs (gitignored)
│   ├── reports/                # Generated PDF reports (gitignored)
│   ├── .env.example            # Environment variable template
│   └── package.json
├── frontend/                   # React + Vite UI
│   ├── src/
│   │   ├── App.jsx             # Router setup
│   │   ├── main.jsx            # React entry point
│   │   ├── index.css           # Global styles
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx/css
│   │   │   ├── UploadSection.jsx/css
│   │   │   ├── LoadingState.jsx/css
│   │   │   ├── SummaryCards.jsx/css
│   │   │   ├── AgreementDetails.jsx/css
│   │   │   ├── ClauseChecklist.jsx/css
│   │   │   ├── EvidenceViewer.jsx/css
│   │   │   ├── RiskSummary.jsx/css
│   │   │   ├── ReportActions.jsx/css
│   │   │   └── ErrorMessage.jsx/css
│   │   ├── pages/
│   │   │   ├── Home.jsx/css    # Upload page
│   │   │   ├── Analysis.jsx/css # Results display
│   │   │   └── History.jsx/css # Past analyses
│   │   └── services/
│   │       └── api.js          # Axios API client
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json                # Root scripts (install:all, dev:backend, dev:frontend)
└── README.md
```

---

## Setup

### 1. Install all dependencies

From the project root:

```bash
npm run install:all
```

Or manually:

```bash
cd backend && npm install
cd ../frontend && npm install
```

> If `better-sqlite3` fails on Windows, see the Windows Build Tools section above.

### 2. Configure environment variables

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env`:

```env
PORT=3001
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
MAX_FILE_SIZE_MB=10
FRONTEND_URL=http://localhost:5173
```

### Environment Variable Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Port the Express server listens on |
| `OPENAI_API_KEY` | **Yes** | — | API key for your LLM provider |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | Base URL for OpenAI-compatible API |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model name to use for analysis |
| `MAX_FILE_SIZE_MB` | No | `10` | Maximum PDF upload size in megabytes |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin for the frontend |

---

## Running the Application

### Development mode

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
node src/server.js
```
Expected output:
```
Database initialized
Server running on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
```
Expected output:
```
  VITE v6.x.x  ready in Xms
  ➜  Local:   http://localhost:5173/
```

Then open **http://localhost:5173** in your browser.

### Using root convenience scripts

```bash
# Install all dependencies
npm run install:all

# Start backend
npm run dev:backend

# Start frontend (in a second terminal)
npm run dev:frontend

# Build frontend for production
npm run build:frontend
```

### Application URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health check | http://localhost:3001/api/health |

---

## API Route Summary

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Returns `{ status: "ok", timestamp }` |

### Analysis

| Method | Path | Description |
|---|---|---|
| POST | `/api/analysis` | Upload PDF and run analysis. `multipart/form-data`, field `file`. Returns full analysis JSON. |
| GET | `/api/analysis/:id` | Retrieve a stored analysis by ID |
| GET | `/api/analysis/:id/report` | Download analysis as a PDF report |
| GET | `/api/analysis/:id/json` | Download raw analysis result as JSON |

### History

| Method | Path | Description |
|---|---|---|
| GET | `/api/history` | List past analyses. Query params: `page` (default 1), `limit` (default 20) |
| DELETE | `/api/history/:id` | Delete an analysis record and its associated files |

---

## Architecture Notes

- **PDF extraction**: `pdfjs-dist` legacy build via dynamic ESM import (`import('pdfjs-dist/legacy/build/pdf.mjs')`). Runs in Node.js without a browser worker. `GlobalWorkerOptions.workerSrc` is set to `''` to suppress the worker warning.
- **LLM analysis**: OpenAI-compatible REST API called via `fetch`. Response validated against a Zod schema. Retries on transient errors with exponential backoff. Falls back to partial results if the model returns malformed JSON.
- **Database**: `better-sqlite3` (synchronous SQLite). No database server needed — data lives in `backend/database.sqlite`.
- **Report generation**: `pdfkit` generates PDF reports server-side from the analysis result.
- **Security**: `helmet` sets secure HTTP headers, `cors` restricts origins to `FRONTEND_URL`, `express-rate-limit` throttles the analysis endpoint.
- **Validation**: `zod` validates both incoming HTTP request bodies and LLM JSON output.
- **ESM**: Both `frontend/` and `backend/` use ES modules (`"type": "module"` in `package.json`). Use `import`/`export` throughout. `__dirname` equivalent: `path.dirname(fileURLToPath(import.meta.url))`.

---

## Troubleshooting

### `better-sqlite3` build fails on Windows

```bash
npm install --global node-gyp
npm install --global windows-build-tools
# Then retry:
cd backend && npm install
```

If that still fails, install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) manually with the C++ workload selected.

### pdfjs-dist "Setting up fake worker" warning

This is expected in Node.js. The warning is suppressed automatically by the backend setting `GlobalWorkerOptions.workerSrc = ''`. It does not affect PDF extraction.

### LLM returns partial results

If the AI model returns malformed JSON, the backend logs a warning and returns `partial: true` in the response. The frontend displays "Not Found" for missing fields rather than crashing.

### Port already in use

Change the port in `backend/.env`:
```env
PORT=3002
```
Then update `VITE_API_URL` in `frontend/.env` (if present) to match.

### Analysis takes a long time

PDF text extraction and LLM calls can take 10–30 seconds for large documents. The loading screen shows processing stages to indicate progress.

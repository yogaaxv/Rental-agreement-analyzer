# Rental Agreement Analyzer

An AI-powered web application that analyzes rental agreement PDFs and extracts key details, identifies important conditions, detects missing clauses, and provides page-level evidence references.

## Project Overview

- Upload a rental agreement PDF
- AI extracts rent, deposit, dates, and 10+ other fields
- Clause checklist shows what's present, missing, or needs review
- Important conditions highlighted with exact quotations and page numbers
- Downloadable PDF and JSON reports
- Analysis history stored locally in SQLite

> **Disclaimer:** This tool is for informational purposes only. It does not provide legal advice or determine the legal validity of any rental agreement.

---

## Prerequisites

- **Node.js** v18 or later (v24 recommended)
- **npm** v8 or later
- **Windows Build Tools** (required for `better-sqlite3` native bindings on Windows):
  ```
  npm install --global windows-build-tools
  ```
  Or install **Visual Studio Build Tools** with the "Desktop development with C++" workload.
- An **OpenAI-compatible API key** (OpenAI, Azure OpenAI, or any compatible provider)

---

## Project Structure

```
rental-agreement-analyzer/
├── backend/               # Node.js/Express API
│   ├── src/
│   │   ├── app.js         # Express app setup
│   │   ├── server.js      # Entry point
│   │   ├── controllers/   # Route handlers
│   │   ├── routes/        # Express routers
│   │   ├── services/      # PDF, LLM, report logic
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── database/      # SQLite + schema
│   │   ├── middleware/     # Upload, error handling
│   │   └── utils/         # Text utilities
│   ├── uploads/           # Uploaded PDFs (gitignored)
│   └── reports/           # Generated PDF reports (gitignored)
├── frontend/              # React/Vite UI
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Home, Analysis, History
│       └── services/      # Axios API client
├── .gitignore
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

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env
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

### 3. Run the backend

```bash
cd backend
node src/server.js
```

You should see:
```
Server running on http://localhost:3001
```

### 4. Run the frontend (in a second terminal)

```bash
npm run dev:frontend
```

Open **http://localhost:5173** in your browser.

---

## API Reference

### Health Check

```
GET /api/health
→ { "status": "ok", "timestamp": "..." }
```

### Upload & Analyze

```
POST /api/analysis
Content-Type: multipart/form-data
Body: file=<PDF file>

→ {
    "id": "uuid",
    "filename": "agreement.pdf",
    "pageCount": 5,
    "details": { ... },
    "clauses": { ... },
    "conditions": [ ... ],
    "risk_summary": [ ... ]
  }
```

### Get Analysis

```
GET /api/analysis/:id
→ Full analysis result JSON
```

### Download PDF Report

```
GET /api/analysis/:id/report
→ application/pdf (streamed)
```

### Download JSON Result

```
GET /api/analysis/:id/json
→ application/json (downloadable)
```

### Analysis History

```
GET /api/history?page=1&limit=20
→ { "analyses": [...], "total": N, "page": 1, "limit": 20, "totalPages": N }
```

### Delete Analysis

```
DELETE /api/history/:id
→ { "success": true, "id": "uuid" }
```

---

## Architecture Notes

- **PDF extraction**: `pdfjs-dist` (legacy build) via dynamic ESM import — runs in Node.js without a browser worker
- **LLM analysis**: OpenAI-compatible REST API with Zod output validation and exponential backoff retry
- **Database**: `better-sqlite3` (synchronous SQLite) — no server needed, stores locally
- **Report generation**: `pdfkit` for server-side PDF creation
- **Security**: `helmet` for HTTP headers, `cors` for origin control, `express-rate-limit` for API throttling
- **Validation**: `zod` for both HTTP input and LLM output schema validation

---

## Troubleshooting

### `better-sqlite3` build fails on Windows

Install build tools first:
```bash
npm install --global node-gyp
npm install --global windows-build-tools
```
Then retry `npm install` in the `backend/` directory.

### pdfjs-dist worker warning

The warning `Setting up fake worker` is expected in Node.js. It is suppressed by setting `GlobalWorkerOptions.workerSrc = ''`.

### LLM returns partial results

If the AI model returns malformed JSON, the backend logs a warning and returns `partial: true` in the response. The frontend handles this gracefully with "Not Found" fallbacks.

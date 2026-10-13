# Implementation Plan — Rental Agreement Analyzer

> **Greenfield project.** All files are to be created from scratch.
> Node.js v24.21.0 · npm 11.19.0 · Windows (PowerShell)
> Workspace root: `c:\Users\acer\rental-agreement-analyzer`

---

## Architecture decisions

**Backend first, then frontend.** The frontend depends on the API contract; building backend first lets the frontend be verified end-to-end.

**pdfjs-dist v4.9.155 in Node.js ESM.** The main build uses web APIs unavailable in Node. The `legacy/build/pdf.mjs` export works in Node without polyfills. It must be loaded via a dynamic `import()` call (never a static import at module top-level, because the library tries to resolve a worker path on load). Worker is disabled by setting `GlobalWorkerOptions.workerSrc = ''` immediately after the dynamic import resolves.

**better-sqlite3 instead of sqlite3.** Synchronous API maps naturally to Express request handlers without callback hell. It requires a native compile step — Windows users need Visual Studio Build Tools (or `npm install --global windows-build-tools` on older Node).

**Express v5.3.0.** Stable, async-aware (async route errors propagate to error handler without try/catch wrappers), widely compatible.

**React Router v7 (framework-mode disabled).** Used purely as a client-side router (`<BrowserRouter>`). No server-rendering.

**Loading stages driven by upload progress + polling timer.** Stage 1 is tied to the XHR `onUploadProgress` event reaching 100%. Stages 2-6 advance on a 4-second timer while the backend processes. No fake percentage bars.

**LLM response is always Zod-validated.** If validation fails (partial or malformed JSON), the backend returns whatever it can extract with a `partial: true` flag; the frontend displays a warning but still renders what it has.

**PDF report generated on demand.** The `/api/analysis/:id/report` endpoint generates the PDF the first time it is requested and caches it in `backend/reports/`. Subsequent requests stream the cached file.

---

## Package versions

### Backend (`backend/package.json`)
```json
{
  "type": "module",
  "dependencies": {
    "express": "5.3.0",
    "multer": "2.4.0",
    "pdfjs-dist": "4.9.155",
    "better-sqlite3": "11.0.3",
    "zod": "3.25.76",
    "pdfkit": "0.20.2",
    "dotenv": "16.5.0",
    "helmet": "8.3.0",
    "cors": "2.8.6",
    "express-rate-limit": "7.5.1",
    "uuid": "11.1.0"
  }
}
```

> ⚠️ **Windows note:** `better-sqlite3` compiles native C++ bindings. If `npm install` fails with node-gyp errors, run the following first:
> ```
> npm install --global node-gyp
> npm install --global windows-build-tools
> ```
> Or install "Desktop development with C++" workload from Visual Studio Installer.

### Frontend (`frontend/package.json`)
```json
{
  "dependencies": {
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-router-dom": "7.6.2",
    "axios": "1.9.0",
    "lucide-react": "0.511.0"
  },
  "devDependencies": {
    "vite": "6.3.5",
    "@vitejs/plugin-react": "4.5.2"
  }
}
```

---

## pdfjs-dist Node.js ESM pattern

```js
// backend/src/services/pdfService.js
// Dynamic import avoids worker-path resolution errors at module load time
const { default: pdfjsLib } = await import('pdfjs-dist/legacy/build/pdf.mjs');

// Disable the worker — Node.js runs the parser in-thread (no web worker)
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

const doc = await pdfjsLib.getDocument({
  data: pdfData,          // Uint8Array
  useWorkerFetch: false,  // prevents fetch() calls for remote resources
  isEvalSupported: false, // sandboxed environment safety
  useSystemFonts: true,   // avoids font-file path resolution errors
}).promise;
```

---

## Zod schema shapes

```js
// backend/src/schemas/analysisSchema.js (key shapes)

const AgreementDetailSchema = z.object({
  value: z.string(),
  page: z.number().int().min(1).optional(),
  quotation: z.string().max(500).optional(),
});

const ClauseSchema = z.object({
  status: z.enum(['found', 'not_found', 'needs_review']),
  page: z.number().int().min(1).optional(),
  note: z.string().optional(),
});

const ConditionSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  quotation: z.string(),
  page: z.number().int().min(1),
  category: z.enum(['financial', 'notice', 'termination', 'maintenance', 'other']).optional(),
});

const RiskItemSchema = z.object({
  type: z.enum(['missing', 'warning', 'info']),
  message: z.string(),
});

const LLMOutputSchema = z.object({
  details: z.object({
    monthly_rent:      AgreementDetailSchema.optional(),
    security_deposit:  AgreementDetailSchema.optional(),
    start_date:        AgreementDetailSchema.optional(),
    end_date:          AgreementDetailSchema.optional(),
    lease_duration:    AgreementDetailSchema.optional(),
    notice_period:     AgreementDetailSchema.optional(),
    maintenance:       AgreementDetailSchema.optional(),
    rent_escalation:   AgreementDetailSchema.optional(),
    late_payment:      AgreementDetailSchema.optional(),
    early_termination: AgreementDetailSchema.optional(),
    renewal_terms:     AgreementDetailSchema.optional(),
    utilities:         AgreementDetailSchema.optional(),
    deposit_refund:    AgreementDetailSchema.optional(),
  }),
  clauses: z.object({
    rent_payment:        ClauseSchema.optional(),
    security_deposit:    ClauseSchema.optional(),
    lease_duration:      ClauseSchema.optional(),
    notice_termination:  ClauseSchema.optional(),
    maintenance_repairs: ClauseSchema.optional(),
    utilities:           ClauseSchema.optional(),
    rent_escalation:     ClauseSchema.optional(),
    renewal:             ClauseSchema.optional(),
    property_damage:     ClauseSchema.optional(),
    signatures_dates:    ClauseSchema.optional(),
  }),
  conditions:   z.array(ConditionSchema).max(20),
  risk_summary: z.array(RiskItemSchema).max(15),
});

// Robust parser — strips markdown fences, extracts first JSON block,
// runs Zod, returns { success, data, error }
function safeParseLLMOutput(rawString) {
  const cleaned = extractJsonFromString(rawString);
  try {
    const parsed = JSON.parse(cleaned);
    return LLMOutputSchema.safeParse(parsed);
  } catch {
    return { success: false, error: 'JSON parse failed' };
  }
}
```

---

## LLM prompt

```
SYSTEM:
You are a rental agreement analysis assistant. Analyze the provided rental
agreement text and extract structured information. Return ONLY valid JSON
matching the specified schema. Be precise — only extract information
explicitly stated in the document. If a field is not found, set value to
"Not Found" and omit page/quotation. For quotations, use exact text from
the document (max 200 characters). Page numbers must match the [PAGE N]
markers in the input.

USER:
Analyze this rental agreement and return a JSON object with this exact structure:
{
  "details": {
    "monthly_rent":      { "value": "...", "page": N, "quotation": "..." },
    "security_deposit":  { "value": "...", "page": N, "quotation": "..." },
    "start_date":        { "value": "...", "page": N, "quotation": "..." },
    "end_date":          { "value": "...", "page": N, "quotation": "..." },
    "lease_duration":    { "value": "...", "page": N, "quotation": "..." },
    "notice_period":     { "value": "...", "page": N, "quotation": "..." },
    "maintenance":       { "value": "...", "page": N, "quotation": "..." },
    "rent_escalation":   { "value": "...", "page": N, "quotation": "..." },
    "late_payment":      { "value": "...", "page": N, "quotation": "..." },
    "early_termination": { "value": "...", "page": N, "quotation": "..." },
    "renewal_terms":     { "value": "...", "page": N, "quotation": "..." },
    "utilities":         { "value": "...", "page": N, "quotation": "..." },
    "deposit_refund":    { "value": "...", "page": N, "quotation": "..." }
  },
  "clauses": {
    "rent_payment":        { "status": "found|not_found|needs_review", "page": N, "note": "..." },
    "security_deposit":    { "status": "...", "page": N, "note": "..." },
    "lease_duration":      { "status": "...", "page": N, "note": "..." },
    "notice_termination":  { "status": "...", "page": N, "note": "..." },
    "maintenance_repairs": { "status": "...", "page": N, "note": "..." },
    "utilities":           { "status": "...", "page": N, "note": "..." },
    "rent_escalation":     { "status": "...", "page": N, "note": "..." },
    "renewal":             { "status": "...", "page": N, "note": "..." },
    "property_damage":     { "status": "...", "page": N, "note": "..." },
    "signatures_dates":    { "status": "...", "page": N, "note": "..." }
  },
  "conditions": [
    {
      "title": "...",
      "explanation": "...",
      "quotation": "...",
      "page": N,
      "category": "financial|notice|termination|maintenance|other"
    }
  ],
  "risk_summary": [
    { "type": "missing|warning|info", "message": "..." }
  ]
}

RENTAL AGREEMENT TEXT (with page markers):
[PAGE 1]
<page 1 text>

[PAGE 2]
<page 2 text>
...
```

---

## 6-stage loading animation

The loading state is driven by **two signals** combined in `Home.jsx`:

| Stage | Trigger |
|-------|---------|
| 1 — Uploading document | Immediately on form submit; exits when `onUploadProgress.loaded === total` |
| 2 — Extracting PDF text | Timer starts when upload reaches 100% |
| 3 — Identifying rental conditions | Timer +4s |
| 4 — Checking expected clauses | Timer +4s |
| 5 — Verifying evidence | Timer +4s |
| 6 — Preparing the report | Timer +4s, stays here until API response arrives |

On API response: either navigate to `/analysis/:id` (success) or show `<ErrorMessage />` (failure). The timer is cleared by a `useEffect` cleanup function to prevent state updates on unmounted components.

---

## File creation order (dependency order)

- [ ] 1. **Root scaffold**: `package.json` (workspace scripts), `.gitignore`, `README.md`
      Files: `package.json`, `.gitignore`, `README.md`
      Verify: `cat package.json` shows scripts object with dev:backend, dev:frontend

- [ ] 2. **Backend package setup**: `backend/package.json`, `backend/.env.example`
      Files: `backend/package.json`, `backend/.env.example`
      Verify: `node -e "import('./backend/package.json', {assert:{type:'json'}}).then(m=>console.log(m.default.type))"` prints `module`

- [ ] 3. **Backend install**: run `npm install` in `backend/`
      Files: `backend/node_modules/` (generated)
      Verify: `cd backend && npm install` exits 0; `node -e "import('better-sqlite3').then(()=>console.log('ok'))"` prints `ok`

- [ ] 4. **Database layer**: `schema.sql`, `database.js`
      Files: `backend/src/database/schema.sql`, `backend/src/database/database.js`
      Verify: `node -e "import('./backend/src/database/database.js').then(m=>console.log('db ok'))"` prints `db ok` and creates `database.sqlite`

- [ ] 5. **Utilities and schema**: `textUtils.js`, `analysisSchema.js`
      Files: `backend/src/utils/textUtils.js`, `backend/src/schemas/analysisSchema.js`
      Verify: `node -e "import('./backend/src/schemas/analysisSchema.js').then(m=>console.log(Object.keys(m)))"` lists exports

- [ ] 6. **PDF service**: `pdfService.js`
      Files: `backend/src/services/pdfService.js`
      Verify: `node backend/src/services/pdfService.js` (add a self-test that loads a small test PDF) exits 0 and prints page count

- [ ] 7. **LLM service**: `llmService.js`
      Files: `backend/src/services/llmService.js`
      Verify: module imports cleanly; actual LLM call verified in step 16

- [ ] 8. **Supporting services**: `clauseService.js`, `evidenceService.js`, `reportService.js`, `ocrService.js`
      Files: `backend/src/services/clauseService.js`, `evidenceService.js`, `reportService.js`, `ocrService.js`
      Verify: `node -e "import('./backend/src/services/clauseService.js').then(m=>console.log(Object.keys(m)))"` prints export names

- [ ] 9. **Middleware**: `uploadMiddleware.js`, `errorHandler.js`
      Files: `backend/src/middleware/uploadMiddleware.js`, `backend/src/middleware/errorHandler.js`
      Verify: modules import without error

- [ ] 10. **Controller**: `analysisController.js`
       Files: `backend/src/controllers/analysisController.js`
       Verify: module imports without error; actual behavior tested in step 16

- [ ] 11. **Routes**: `analysisRoutes.js`, `historyRoutes.js`
       Files: `backend/src/routes/analysisRoutes.js`, `backend/src/routes/historyRoutes.js`
       Verify: modules import without error

- [ ] 12. **Express app + server**: `app.js`, `server.js`
       Files: `backend/src/app.js`, `backend/src/server.js`
       Verify: `node backend/src/server.js` starts without errors; `curl http://localhost:3001/api/health` returns `{"status":"ok"}`

- [ ] 13. **Placeholder directories**: `uploads/.gitkeep`, `reports/.gitkeep`
       Files: `backend/uploads/.gitkeep`, `backend/reports/.gitkeep`
       Verify: directories exist

- [ ] 14. **Frontend package setup**: `frontend/package.json`, `frontend/vite.config.js`, `frontend/.env.example`, `frontend/index.html`
       Files: listed above
       Verify: `cat frontend/package.json` shows correct dependencies

- [ ] 15. **Frontend install**
       Files: `frontend/node_modules/` (generated)
       Verify: `cd frontend && npm install` exits 0

- [ ] 16. **Frontend entry + global styles**: `main.jsx`, `index.css`, `App.jsx`
       Files: `frontend/src/main.jsx`, `frontend/src/index.css`, `frontend/src/App.jsx`
       Verify: `npm run build` in frontend/ exits 0

- [ ] 17. **API service layer**: `api.js`
       Files: `frontend/src/services/api.js`
       Verify: no import errors (confirmed by build step)

- [ ] 18. **Shared components**: `Navbar.jsx`, `ErrorMessage.jsx`, `LoadingState.jsx`, `SummaryCards.jsx`, `EvidenceViewer.jsx`
       Files: `frontend/src/components/` (5 files)
       Verify: `npm run build` exits 0

- [ ] 19. **Analysis components**: `AgreementDetails.jsx`, `ClauseChecklist.jsx`, `RiskSummary.jsx`, `ReportActions.jsx`
       Files: `frontend/src/components/` (4 files)
       Verify: `npm run build` exits 0

- [ ] 20. **Upload component**: `UploadSection.jsx`
       Files: `frontend/src/components/UploadSection.jsx`
       Verify: `npm run build` exits 0

- [ ] 21. **Pages**: `Home.jsx`, `Analysis.jsx`, `History.jsx`
       Files: `frontend/src/pages/Home.jsx`, `frontend/src/pages/Analysis.jsx`, `frontend/src/pages/History.jsx`
       Verify: `npm run build` exits 0 — zero errors, zero unresolved imports

- [ ] 22. **End-to-end verification**
       Start backend: `cd backend && node src/server.js`
       Start frontend: `cd frontend && npm run dev`
       Open `http://localhost:5173` — confirm Home page renders with upload area
       Upload a test rental PDF → confirm loading stages animate → confirm analysis results page renders all 6 sections
       Visit `/history` → confirm history page renders
       Click Download PDF Report → confirm PDF opens
       Click Download JSON → confirm JSON file downloads

---

## Key implementation notes per service

### `pdfService.js`
- Dynamic import of `pdfjs-dist/legacy/build/pdf.mjs` — not a static top-level import
- After import: `pdfjsLib.GlobalWorkerOptions.workerSrc = ''`
- `getDocument` options: `useWorkerFetch: false`, `isEvalSupported: false`, `useSystemFonts: true`
- Returns `Array<{ pageNumber, text }>` — text is the joined `items[i].str` from `getTextContent()`
- If total extracted text < 100 chars, log a warning about possible scanned PDF

### `llmService.js`
- Uses `globalThis.fetch` (Node 18+ built-in)
- Retry: max 3 attempts, delays 1000/2000/4000 ms, retries on HTTP 429 and 5xx
- Sets `response_format: { type: 'json_object' }` in the request body — supported by GPT-4o and GPT-4o-mini
- Truncates page text to 3000 chars per page before sending to avoid token overflow
- `safeParseLLMOutput` strips markdown fences (`\`\`\`json ... \`\`\``) before JSON.parse

### `database.js`
- ESM `__dirname`: `const __dirname = path.dirname(fileURLToPath(import.meta.url))`
- WAL mode: `db.pragma('journal_mode = WAL')` after opening
- Schema loaded from file: `db.exec(fs.readFileSync(schemaPath, 'utf8'))`
- All queries use prepared statements (`.prepare().run()` / `.prepare().get()` / `.prepare().all()`)

### `reportService.js`
- Uses pdfkit's streaming API: `new PDFDocument()` → pipe to `fs.createWriteStream`
- Returns a Promise that resolves when the `finish` event fires
- Includes a disclaimer footer: "This report is for informational purposes only and does not constitute legal advice."

### `analysisController.js`
- Does NOT delete the uploaded file after processing (kept for potential re-analysis)
- On LLM `partial: true`, stores whatever was parsed and sets a `partial` flag in the DB result
- Status flow: `pending` → `processing` → `completed` | `failed`

### `Home.jsx` loading stage timer
```js
useEffect(() => {
  if (!loading) return;
  const timer = setInterval(() => {
    setStage(s => (s < 6 ? s + 1 : s));
  }, 4000);
  return () => clearInterval(timer); // cleanup on unmount or loading=false
}, [loading]);
```

### `UploadSection.jsx` drag-and-drop
- `onDragOver` calls `e.preventDefault()` to allow drop
- `onDrop` reads `e.dataTransfer.files[0]`, validates MIME type `application/pdf`
- Hidden `<input type="file" accept=".pdf" />` triggered by a ref click
- Max size validation: `file.size > MAX_SIZE_BYTES` → set error state

---

## Environment variables

### `backend/.env` (from `.env.example`)
```
PORT=3001
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
MAX_FILE_SIZE_MB=10
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### `frontend/.env` (from `.env.example`)
```
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Multer v2 note

Multer v2.x (the current major) uses a slightly different error class path than v1.x. The error handler must import `MulterError` from `multer`:
```js
import multer from 'multer';
if (err instanceof multer.MulterError) { ... }
```

---

## Database schema (key tables)

```sql
-- analyses: one row per upload
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  page_count INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  partial INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- analysis_results: one row per completed analysis
CREATE TABLE IF NOT EXISTS analysis_results (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  details_json TEXT NOT NULL,
  clauses_json TEXT NOT NULL,
  conditions_json TEXT NOT NULL,
  risk_summary_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## API contract summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check → `{status:'ok'}` |
| POST | `/api/analysis` | Upload PDF + analyze → full result JSON |
| GET | `/api/analysis/:id` | Fetch stored result by ID |
| GET | `/api/analysis/:id/report` | Stream or generate PDF report |
| GET | `/api/analysis/:id/json` | Download result as JSON file |
| GET | `/api/history` | Paginated analysis list |
| DELETE | `/api/history/:id` | Delete analysis record |

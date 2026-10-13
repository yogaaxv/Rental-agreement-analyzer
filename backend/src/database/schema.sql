CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER NOT NULL,
  page_count INTEGER,
  status TEXT NOT NULL DEFAULT 'processing',
  error_message TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  monthly_rent TEXT,
  security_deposit TEXT,
  start_date TEXT,
  end_date TEXT,
  lease_duration TEXT,
  notice_period TEXT,
  maintenance TEXT,
  rent_escalation TEXT,
  late_payment TEXT,
  early_termination TEXT,
  renewal_terms TEXT,
  utilities TEXT,
  deposit_refund TEXT,
  raw_details_json TEXT,
  clauses_json TEXT,
  conditions_json TEXT,
  risk_summary_json TEXT,
  page_count INTEGER,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

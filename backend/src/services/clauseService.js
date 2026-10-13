/**
 * Human-readable display names for each clause key.
 */
const CLAUSE_DISPLAY_NAMES = {
  rent_payment: 'Rent and Payment Terms',
  security_deposit: 'Security Deposit',
  lease_duration: 'Lease Duration',
  notice_termination: 'Notice and Termination',
  maintenance_repairs: 'Maintenance and Repairs',
  utilities: 'Utilities',
  rent_escalation: 'Rent Escalation',
  renewal: 'Renewal',
  property_damage: 'Property Damage and Deductions',
  signatures_dates: 'Signatures and Dates',
};

/**
 * Returns the map of clause key → display label.
 * @returns {Record<string, string>}
 */
export function getClauseDisplayNames() {
  return { ...CLAUSE_DISPLAY_NAMES };
}

/**
 * Ensure all 10 expected clause keys are present in the clauses object.
 * Missing keys are defaulted to { status: 'not_found' }.
 *
 * @param {Record<string, object>} clauses - Clause results from LLM parsing.
 * @returns {Record<string, { status: string, page?: number, note?: string, displayName: string }>}
 */
export function enrichClauseResults(clauses = {}) {
  const enriched = {};
  for (const [key, displayName] of Object.entries(CLAUSE_DISPLAY_NAMES)) {
    const existing = clauses[key] || {};
    enriched[key] = {
      status: existing.status || 'not_found',
      ...(existing.page != null ? { page: existing.page } : {}),
      ...(existing.note ? { note: existing.note } : {}),
      displayName,
    };
  }
  return enriched;
}

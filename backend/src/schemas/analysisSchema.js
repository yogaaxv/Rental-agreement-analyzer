import { z } from 'zod';
import { extractJsonFromString } from '../utils/textUtils.js';

// A single extracted detail field
export const AgreementDetailSchema = z.object({
  value: z.string(),
  page: z.number().int().min(1).optional(),
  quotation: z.string().optional(),
});

// Clause status enum
export const ClauseStatusSchema = z.enum(['found', 'not_found', 'needs_review']);

// A clause check result
export const ClauseSchema = z.object({
  status: ClauseStatusSchema,
  page: z.number().int().min(1).optional(),
  note: z.string().optional(),
});

// An important condition extracted from the document
export const ConditionSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  quotation: z.string(),
  page: z.number().int().min(1),
  category: z.string().optional(),
});

// A risk or advisory item
export const RiskItemSchema = z.object({
  type: z.enum(['missing', 'warning', 'info']),
  message: z.string(),
});

// Full LLM output shape
export const LLMOutputSchema = z.object({
  details: z.object({
    monthly_rent: AgreementDetailSchema.optional(),
    security_deposit: AgreementDetailSchema.optional(),
    start_date: AgreementDetailSchema.optional(),
    end_date: AgreementDetailSchema.optional(),
    lease_duration: AgreementDetailSchema.optional(),
    notice_period: AgreementDetailSchema.optional(),
    maintenance: AgreementDetailSchema.optional(),
    rent_escalation: AgreementDetailSchema.optional(),
    late_payment: AgreementDetailSchema.optional(),
    early_termination: AgreementDetailSchema.optional(),
    renewal_terms: AgreementDetailSchema.optional(),
    utilities: AgreementDetailSchema.optional(),
    deposit_refund: AgreementDetailSchema.optional(),
  }),
  clauses: z.object({
    rent_payment: ClauseSchema.optional(),
    security_deposit: ClauseSchema.optional(),
    lease_duration: ClauseSchema.optional(),
    notice_termination: ClauseSchema.optional(),
    maintenance_repairs: ClauseSchema.optional(),
    utilities: ClauseSchema.optional(),
    rent_escalation: ClauseSchema.optional(),
    renewal: ClauseSchema.optional(),
    property_damage: ClauseSchema.optional(),
    signatures_dates: ClauseSchema.optional(),
  }),
  conditions: z.array(ConditionSchema).max(20),
  risk_summary: z.array(RiskItemSchema).max(15),
});

/**
 * Safely parse raw LLM string output into validated LLM output.
 * @param {string} rawString
 * @returns {{ success: boolean, data?: import('zod').infer<typeof LLMOutputSchema>, error?: string, partial?: boolean }}
 */
export function safeParseLLMOutput(rawString) {
  try {
    const jsonStr = extractJsonFromString(rawString);
    if (!jsonStr) {
      return { success: false, error: 'No JSON object found in LLM response' };
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      return { success: false, error: `JSON parse error: ${parseErr.message}` };
    }

    const result = LLMOutputSchema.safeParse(parsed);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      // Return partial data with a warning
      console.warn('[safeParseLLMOutput] Zod validation failed, returning partial data:', result.error.message);
      return {
        success: false,
        data: parsed,
        error: result.error.message,
        partial: true,
      };
    }
  } catch (err) {
    return { success: false, error: `Unexpected error during parse: ${err.message}` };
  }
}

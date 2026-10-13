import { safeParseLLMOutput } from '../schemas/analysisSchema.js';

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // ms

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build the user prompt from page texts.
 * @param {Array<{ pageNumber: number, text: string }>} pageTexts
 * @returns {string}
 */
function buildUserPrompt(pageTexts) {
  const documentText = pageTexts
    .map((p) => `[PAGE ${p.pageNumber}]\n${p.text}`)
    .join('\n\n');

  return `Analyze this rental agreement and return a JSON object with this exact structure:
{
  "details": {
    "monthly_rent": { "value": "...", "page": N, "quotation": "..." },
    "security_deposit": { "value": "...", "page": N, "quotation": "..." },
    "start_date": { "value": "...", "page": N, "quotation": "..." },
    "end_date": { "value": "...", "page": N, "quotation": "..." },
    "lease_duration": { "value": "...", "page": N, "quotation": "..." },
    "notice_period": { "value": "...", "page": N, "quotation": "..." },
    "maintenance": { "value": "...", "page": N, "quotation": "..." },
    "rent_escalation": { "value": "...", "page": N, "quotation": "..." },
    "late_payment": { "value": "...", "page": N, "quotation": "..." },
    "early_termination": { "value": "...", "page": N, "quotation": "..." },
    "renewal_terms": { "value": "...", "page": N, "quotation": "..." },
    "utilities": { "value": "...", "page": N, "quotation": "..." },
    "deposit_refund": { "value": "...", "page": N, "quotation": "..." }
  },
  "clauses": {
    "rent_payment": { "status": "found|not_found|needs_review", "page": N, "note": "..." },
    "security_deposit": { "status": "found|not_found|needs_review", "page": N, "note": "..." },
    "lease_duration": { "status": "found|not_found|needs_review", "page": N, "note": "..." },
    "notice_termination": { "status": "found|not_found|needs_review", "page": N, "note": "..." },
    "maintenance_repairs": { "status": "found|not_found|needs_review", "page": N, "note": "..." },
    "utilities": { "status": "found|not_found|needs_review", "page": N, "note": "..." },
    "rent_escalation": { "status": "found|not_found|needs_review", "page": N, "note": "..." },
    "renewal": { "status": "found|not_found|needs_review", "page": N, "note": "..." },
    "property_damage": { "status": "found|not_found|needs_review", "page": N, "note": "..." },
    "signatures_dates": { "status": "found|not_found|needs_review", "page": N, "note": "..." }
  },
  "conditions": [
    { "title": "...", "explanation": "...", "quotation": "...", "page": N, "category": "financial|notice|termination|maintenance|other" }
  ],
  "risk_summary": [
    { "type": "missing|warning|info", "message": "..." }
  ]
}

RENTAL AGREEMENT TEXT (with page markers):
${documentText}
`;
}

/**
 * Make a single LLM API call.
 * @param {string} userPrompt
 * @returns {Promise<{ content: string, tokensUsed: number }>}
 */
async function callLLMAPI(userPrompt) {
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a rental agreement analysis assistant. Analyze the provided rental agreement text and extract structured information. Return ONLY valid JSON matching the specified schema. Be precise — only extract information explicitly stated in the document. If a field is not found, set value to "Not Found" and omit page/quotation. For quotations, use exact text from the document (max 200 characters). Page numbers must match the [PAGE N] markers in the input.',
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(`LLM API error ${response.status}: ${errorText}`);
    err.status = response.status;
    throw err;
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content || '';
  const tokensUsed = json.usage?.total_tokens || 0;
  return { content, tokensUsed };
}

/**
 * Analyze a rental agreement using the LLM API.
 * Implements retry with exponential backoff on 429 and 5xx errors.
 *
 * @param {Array<{ pageNumber: number, text: string }>} pageTexts
 * @param {string} filename
 * @returns {Promise<{ result: object, partial: boolean, tokensUsed: number }>}
 */
export async function analyzeAgreement(pageTexts, filename) {
  const userPrompt = buildUserPrompt(pageTexts);
  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { content, tokensUsed } = await callLLMAPI(userPrompt);
      const parseResult = safeParseLLMOutput(content);

      if (parseResult.success) {
        return { result: parseResult.data, partial: false, tokensUsed };
      } else {
        // Zod validation failed — return partial data if available
        console.warn(`[llmService] Partial LLM output for "${filename}": ${parseResult.error}`);
        return {
          result: parseResult.data || {},
          partial: true,
          tokensUsed,
        };
      }
    } catch (err) {
      lastError = err;
      const isRetryable = err.status === 429 || (err.status >= 500 && err.status < 600);

      if (isRetryable && attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt];
        console.warn(`[llmService] Retryable error (attempt ${attempt + 1}/${MAX_RETRIES}), waiting ${delay}ms: ${err.message}`);
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  throw lastError || new Error('LLM analysis failed after all retries');
}

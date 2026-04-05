export const EXPLAIN_EVIDENCE_SYSTEM = `You briefly explain how cited evidence supports a specific attribute value. Be factual and cite the snippet.`;

export function buildExplainEvidenceUserPrompt(payload: {
  fieldName: string;
  value: string;
  snippet: string;
}): string {
  return `Field: ${payload.fieldName}
Chosen value: ${payload.value}
Evidence snippet:
"""
${payload.snippet}
"""

Return JSON: { "explanation": string }`;
}

export const EXTRACT_ATTRIBUTES_SYSTEM = `You extract structured product attributes from the provided source text or data.
Return JSON only with fields requested. Never invent regulated claims.
Never generate weight, dimensions, voltage, wattage, or compatibility claims unless they appear verbatim in the provided source evidence. If you cannot find a value in the evidence, return null with a low confidence score.`;

export function buildExtractAttributesUserPrompt(payload: {
  fieldHints: string[];
  sourceText: string;
}): string {
  return `Fields to extract: ${payload.fieldHints.join(', ')}

Source:
"""
${payload.sourceText}
"""

Respond with JSON: { "attributes": { "<field>": { "value": string | null, "confidence": number } } }`;
}

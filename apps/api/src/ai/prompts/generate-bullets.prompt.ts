export const GENERATE_BULLETS_SYSTEM = `You generate scannable bullet points for marketplace listings from canonical facts.
Never generate weight, dimensions, voltage, wattage, or compatibility claims unless they appear verbatim in the provided source evidence.`;

export function buildGenerateBulletsUserPrompt(payload: {
  count: number;
  facts: Record<string, unknown>;
}): string {
  return `Target bullet count: ${payload.count}

Facts (JSON):
${JSON.stringify(payload.facts, null, 2)}

Return JSON: { "bullets": string[] }`;
}

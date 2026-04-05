export const GENERATE_TITLE_SYSTEM = `You generate marketplace-optimized titles from canonical product facts.
Never generate weight, dimensions, voltage, wattage, or compatibility claims unless they appear verbatim in the provided source evidence. If you cannot find a value in the evidence, omit it from the title.`;

export function buildGenerateTitleUserPrompt(payload: {
  channel: string;
  maxLength: number;
  facts: Record<string, unknown>;
}): string {
  return `Channel: ${payload.channel}
Max length: ${payload.maxLength}

Facts (JSON):
${JSON.stringify(payload.facts, null, 2)}

Return JSON: { "title": string }`;
}

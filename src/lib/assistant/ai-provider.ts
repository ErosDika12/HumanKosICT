import "server-only";

/**
 * Optional, server-side AI text provider for the assistant.
 *
 * Off by default: the assistant always works without it (rules-based,
 * grounded answers — see conversation.ts). When an operator sets a key, the
 * model is used ONLY to phrase a short reply from a fixed list of FACTS the
 * server already looked up; it never chooses which records to show, never
 * triggers actions, and its output is validated before display. Any failure
 * (missing key, timeout, HTTP error, empty/oversized output) throws
 * AiProviderError and the caller falls back to the rules-based text with an
 * honest notice.
 *
 * Configuration (server environment only — never exposed to the browser):
 *   ASSISTANT_AI_API_KEY   (alias: AI_GATEWAY_API_KEY)  required to enable
 *   ASSISTANT_AI_PROVIDER  label shown in the UI; default "gateway"
 *   ASSISTANT_AI_BASE_URL  OpenAI-compatible base URL; default Vercel AI Gateway
 *   ASSISTANT_AI_MODEL     default "anthropic/claude-haiku-4.5"
 *   ASSISTANT_DAILY_LIMIT / ASSISTANT_AI_DAILY_LIMIT  per-account usage caps
 */
export interface AiProviderConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function getAiProviderConfig(): AiProviderConfig | null {
  const apiKey = process.env.ASSISTANT_AI_API_KEY || process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return null;
  return {
    provider: process.env.ASSISTANT_AI_PROVIDER || "gateway",
    apiKey,
    baseUrl: (process.env.ASSISTANT_AI_BASE_URL || "https://ai-gateway.vercel.sh/v1").replace(/\/+$/, ""),
    model: process.env.ASSISTANT_AI_MODEL || "anthropic/claude-haiku-4.5",
  };
}

export function isAiProviderConfigured(): boolean {
  return getAiProviderConfig() !== null;
}

export const AI_PROVIDER_REQUEST_TIMEOUT_MS = 8000;
export const AI_MAX_OUTPUT_CHARS = 700;

export class AiProviderError extends Error {}

/** Kept for the earlier intent-extraction hook: shape-validates anything a provider returns. */
export interface ModelIntentGuess {
  category?: string;
  when?: string;
  accessibility?: boolean;
  nearMe?: boolean;
}

export function parseModelIntentResponse(raw: unknown): ModelIntentGuess | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const guess: ModelIntentGuess = {};
  if (typeof obj.category === "string") guess.category = obj.category;
  if (typeof obj.when === "string") guess.when = obj.when;
  if (typeof obj.accessibility === "boolean") guess.accessibility = obj.accessibility;
  if (typeof obj.nearMe === "boolean") guess.nearMe = obj.nearMe;
  return guess;
}

export const GROUNDING_SYSTEM_PROMPT = [
  "You are the Human Network demo assistant for a FICTIONAL Prishtina 2036 scenario.",
  "Write a short, friendly reply (max 80 words, plain text, no markdown links).",
  "Use ONLY the FACTS provided. Never invent activities, people, dates, times, openings, friendships, availability or completed actions.",
  "You cannot perform actions: buttons shown under your message do that. Never say you booked, sent, joined or invited anything.",
  "If the FACTS do not answer the question, say so plainly. Everything is demo content; do not imply real people.",
].join(" ");

export interface GroundedTextInput {
  history: { role: "user" | "assistant"; content: string }[];
  facts: unknown;
  fetchImpl?: typeof fetch;
}

/** Strips anything that could smuggle markup or links into the UI, then bounds the length. */
export function sanitizeModelText(raw: string): string {
  const text = raw
    .replace(/<[^>]*>/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();
  if (!text) throw new AiProviderError("The model returned an empty reply.");
  return text.length > AI_MAX_OUTPUT_CHARS ? `${text.slice(0, AI_MAX_OUTPUT_CHARS - 1).trimEnd()}…` : text;
}

/**
 * One OpenAI-compatible chat completion. The key is read from the server
 * environment and sent only to the configured base URL.
 */
export async function generateGroundedText({ history, facts, fetchImpl = fetch }: GroundedTextInput): Promise<string> {
  const config = getAiProviderConfig();
  if (!config) throw new AiProviderError("No AI provider configured — set ASSISTANT_AI_API_KEY.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_PROVIDER_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 260,
        temperature: 0.2,
        messages: [
          { role: "system", content: `${GROUNDING_SYSTEM_PROMPT}\n\nFACTS (JSON): ${JSON.stringify(facts)}` },
          ...history.slice(-6),
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new AiProviderError(`The AI provider answered with HTTP ${res.status}.`);
    const json = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new AiProviderError("The AI provider returned an unexpected response.");
    return sanitizeModelText(content);
  } catch (err) {
    if (err instanceof AiProviderError) throw err;
    if (err instanceof Error && err.name === "AbortError") throw new AiProviderError("The AI provider timed out.");
    throw new AiProviderError("The AI provider could not be reached.");
  } finally {
    clearTimeout(timer);
  }
}

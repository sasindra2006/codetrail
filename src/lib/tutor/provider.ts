import "server-only";

import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
const MAX_RESPONSE_TOKENS = 4096;
const REQUEST_TIMEOUT_MS = 55_000;

export class TutorConfigurationError extends Error {}

export function getTutorConfiguration() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  if (!apiKey) throw new TutorConfigurationError("AI Tutor is not configured.");
  // This milestone intentionally supports only the configured stable, standard model.
  // It never switches models or invokes paid-only APIs when a request is unavailable.
  if (model !== DEFAULT_GEMINI_MODEL) throw new TutorConfigurationError("The configured AI Tutor model is not supported.");
  return { apiKey, model };
}

export type TutorTurn = { role: "user" | "model"; text: string };
export type TutorProviderEvent =
  | { type: "text"; text: string }
  | { type: "finish"; reason: string };

export async function* streamTutorResponse(options: {
  turns: TutorTurn[];
  systemInstruction: string;
  signal: AbortSignal;
}): AsyncGenerator<TutorProviderEvent> {
  const { apiKey, model } = getTutorConfiguration();
  const ai = new GoogleGenAI({ apiKey });
  const stream = await ai.models.generateContentStream({
    model,
    contents: options.turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    config: {
      systemInstruction: options.systemInstruction,
      maxOutputTokens: MAX_RESPONSE_TOKENS,
      temperature: 0.35,
      abortSignal: options.signal,
      httpOptions: { timeout: REQUEST_TIMEOUT_MS },
    },
  });
  for await (const chunk of stream) {
    if (chunk.text) yield { type: "text", text: chunk.text };
    const finishReason = chunk.candidates?.[0]?.finishReason;
    if (finishReason) yield { type: "finish", reason: String(finishReason) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// lib/claude.ts
//
// Unified LLM wrapper. Auto-detects which API key is set in .env.local.
// Anthropic takes priority; falls back to Gemini.
// Set ONE key and leave the other blank — never set both simultaneously.
//
// Reads ANTHROPIC_API_KEY from environment automatically
// GEMINI_API_KEY=AIza...         → uses gemini-2.5-flash
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function callClaude(
  system: string,
  userPrompt: string
): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // Anthropic takes priority if key is set and non-empty
  if (anthropicKey) {
    const client = new Anthropic({ apiKey: anthropicKey });
    const res = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = res.content[0];
    if (block.type !== "text") {
      throw new Error(`Unexpected content block type: ${block.type}`);
    }
    return block.text;
  }

  if (geminiKey) {
    const genai = new GoogleGenerativeAI(geminiKey);
    const model = genai.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: system,
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  }

  throw new Error(
    "No API key configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env.local"
  );
}

// Strip markdown code fences if the model wraps JSON in them despite instructions
export function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
  return JSON.parse(cleaned) as T;
}

import { AnthropicAdapter } from "@copilotkit/runtime";
import { OpenAIAdapter } from "@copilotkit/runtime";
import Anthropic from "@anthropic-ai/sdk";

export type LlmProvider = "anthropic" | "openai";

// Pinned default model. Keep this current with Anthropic's available model IDs.
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

function resolveAnthropicModel() {
  const configuredRaw = (process.env.ANTHROPIC_MODEL || "").trim();
  const configured = configuredRaw.replace(/^['"]|['"]$/g, "");

  // Known removed/deprecated model IDs that now 404 at /v1/messages.
  const deprecatedModels = new Set([
    "claude-3-5-sonnet-latest",
    "claude-3-5-sonnet-20241022",
    "claude-3-7-sonnet-20250219",
  ]);

  if (!configured || deprecatedModels.has(configured)) {
    return DEFAULT_ANTHROPIC_MODEL;
  }

  return configured;
}

export function getLlmProvider(): LlmProvider {
  const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
  return provider === "openai" ? "openai" : "anthropic";
}

export function getServiceAdapter() {
  const provider = getLlmProvider();
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTROPIC_API_KEY;
  if (!process.env.ANTHROPIC_API_KEY && anthropicApiKey) {
    process.env.ANTHROPIC_API_KEY = anthropicApiKey;
  }

  if (provider === "openai") {
    return new OpenAIAdapter({
      model: process.env.OPENAI_MODEL || "gpt-4o",
    });
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });
  return new AnthropicAdapter({
    anthropic,
    model: resolveAnthropicModel(),
  });
}

import { AnthropicAdapter } from "@copilotkit/runtime";
import { OpenAIAdapter } from "@copilotkit/runtime";

export type LlmProvider = "anthropic" | "openai";

export function getLlmProvider(): LlmProvider {
  const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
  return provider === "openai" ? "openai" : "anthropic";
}

export function getServiceAdapter() {
  const provider = getLlmProvider();

  if (provider === "openai") {
    return new OpenAIAdapter({
      model: process.env.OPENAI_MODEL || "gpt-4o",
    });
  }

  return new AnthropicAdapter({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  });
}

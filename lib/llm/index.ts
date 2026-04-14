import { AnthropicAdapter } from "@copilotkit/runtime";
import { OpenAIAdapter } from "@copilotkit/runtime";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

export type LlmProvider = "anthropic" | "openai";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

function resolveAnthropicModel() {
  const configuredRaw = (process.env.ANTHROPIC_MODEL || "").trim();
  const configured = configuredRaw.replace(/^['"]|['"]$/g, "");

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
  const adapter = new AnthropicAdapter({
    anthropic,
    model: resolveAnthropicModel(),
  });

  // ── Inject system prompt ────────────────────────────────────────────────────
  // In AG-UI mode, useCopilotAdditionalInstructions does not populate the first
  // message (system TextMessage) that AnthropicAdapter.process() expects.
  // We wrap process() to inject our system prompt whenever it would be empty.
  //
  // AnthropicAdapter.process() does:
  //   const instructionsMessage = messages.shift();
  //   const instructions = instructionsMessage.isTextMessage() ? instructionsMessage.content : "";
  //
  // We prepend a fake TextMessage-compatible object so `instructions` is always set.
  const originalProcess = adapter.process.bind(adapter);

  adapter.process = async (req) => {
    const msgs = req.messages as unknown as Array<Record<string, unknown>>;

    const firstMsg = msgs[0];
    const firstIsSystem =
      typeof firstMsg?.isTextMessage === "function" &&
      (firstMsg.isTextMessage as () => boolean)() &&
      firstMsg.role === "system";

    if (!firstIsSystem) {
      // Prepend our system TextMessage so the adapter uses it as instructions
      const systemMsg = {
        type: "TextMessage",
        role: "system",
        content: SYSTEM_PROMPT,
        id: `system-${Date.now()}`,
        createdAt: new Date(),
        status: { code: "success" },
        isTextMessage: () => true,
        isActionExecutionMessage: () => false,
        isResultMessage: () => false,
        isAgentStateMessage: () => false,
        isImageMessage: () => false,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).messages = [systemMsg, ...msgs];
    }

    return originalProcess(req);
  };

  return adapter;
}

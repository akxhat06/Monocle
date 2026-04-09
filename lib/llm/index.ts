export type LlmProvider = "anthropic" | "openai";

export function getLlmProvider(): LlmProvider {
  const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
  return provider === "openai" ? "openai" : "anthropic";
}

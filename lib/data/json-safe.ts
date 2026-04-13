/**
 * Tool results and API JSON must not contain BigInt / Buffer — JSON.stringify throws and
 * breaks CopilotKit / Vercel AI streaming after TOOL_CALL_END with no assistant message.
 */
export function toJsonSafeDeep<T>(input: T): T {
  return JSON.parse(
    JSON.stringify(input, (_key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
        return value.toString("base64");
      }
      return value;
    }),
  ) as T;
}

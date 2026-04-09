import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { getServiceAdapter } from "@/lib/llm";
import { runAnalyticsQuery } from "@/lib/data/query";
import { SCHEMA_DESCRIPTION } from "@/lib/data/schema";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

const runtime = new CopilotRuntime({
  actions: [
    {
      name: "run_analytics_query",
      description: `Execute a read-only SQL query against the user's analytics database. The database uses Row Level Security so results are automatically scoped to the current user. Available schema:\n${SCHEMA_DESCRIPTION}`,
      parameters: [
        {
          name: "sql",
          type: "string" as const,
          description:
            "A read-only SELECT or WITH SQL query. Do not include INSERT, UPDATE, DELETE, or DDL statements.",
          required: true,
        },
        {
          name: "purpose",
          type: "string" as const,
          description:
            "A brief description of what this query is trying to answer.",
          required: true,
        },
      ],
      handler: async ({
        sql,
      }: {
        sql: string;
        purpose: string;
      }) => {
        const result = await runAnalyticsQuery({ sql });
        return result;
      },
    },
  ],
});

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: getServiceAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};

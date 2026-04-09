import { NextResponse } from "next/server";
import { runAnalyticsQuery } from "@/lib/data/query";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body?.tool === "run_analytics_query") {
    const result = await runAnalyticsQuery({ sql: body?.sql ?? "" });
    return NextResponse.json(result);
  }

  return NextResponse.json(
    {
      message: "CopilotKit runtime scaffolded. Wire AG-UI runtime + adapters here.",
      availableTools: ["run_analytics_query"]
    },
    { status: 501 }
  );
}

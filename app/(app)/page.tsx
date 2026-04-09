import { redirect } from "next/navigation";
import DashboardRenderer from "@/components/DashboardRenderer";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div>
          <h1 className="text-xl font-semibold">Monocle</h1>
          <p className="text-sm text-zinc-400">Ask questions and render dashboards from your Supabase data.</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="rounded-md border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="mb-4 text-sm text-zinc-400">
          Copilot chat/runtime is scaffolded at <code>/api/copilotkit</code>. Connect your preferred UI next.
        </p>
        <DashboardRenderer
          node={{
            type: "grid",
            columns: 2,
            children: [
              { type: "kpi", label: "Revenue", value: "$12,431", delta: "+12.4%" },
              { type: "kpi", label: "Orders", value: "1,238", delta: "+4.1%" },
              {
                type: "markdown",
                content: "### Welcome\nYour dashboard renderer is working. Next step: connect `render_dashboard` action from CopilotKit."
              }
            ]
          }}
        />
      </section>
    </main>
  );
}

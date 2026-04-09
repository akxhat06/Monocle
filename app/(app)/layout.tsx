import CopilotClientProvider from "@/components/copilot/CopilotClientProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <CopilotClientProvider>{children}</CopilotClientProvider>;
}

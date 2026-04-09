"use client";

import { CopilotKit } from "@copilotkit/react-core";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // On localhost, CopilotKit otherwise enables the web inspector and pulls announcement UI from their CDN.
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      enableInspector={false}
      showDevConsole={false}
    >
      {children}
    </CopilotKit>
  );
}

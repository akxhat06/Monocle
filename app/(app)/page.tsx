"use client";

import dynamic from "next/dynamic";
import { DM_Sans } from "next/font/google";

const CrmDashboard = dynamic(() => import("@/components/dashboard/CrmDashboard"), {
  ssr: false,
  loading: () => (
    <div className="monocle-app-root flex h-screen items-center justify-center text-sm text-zinc-500">Loading…</div>
  ),
});

const fontSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AppPage() {
  return (
    <div className={`${fontSans.className} monocle-app-root`}>
      <CrmDashboard />
    </div>
  );
}

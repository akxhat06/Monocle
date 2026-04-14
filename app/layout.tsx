import "./globals.css";
/* @copilotkit/react-ui/styles.css removed — we use a fully custom chat UI
   and don't need the default CopilotKit styles (which also inject the
   floating diamond button we don't want). */
import type { Metadata } from "next";
import OpeningAnimationHost from "@/components/OpeningAnimationHost";
import { PRODUCT_DESCRIPTION, PRODUCT_LINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: PRODUCT_LINE,
  description: PRODUCT_DESCRIPTION,
  icons: {
    icon: [{ url: "/monocle-mark-animated.svg", type: "image/svg+xml" }],
    shortcut: "/monocle-mark-animated.svg",
    apple: "/monocle-mark-animated.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OpeningAnimationHost />
        {children}
      </body>
    </html>
  );
}

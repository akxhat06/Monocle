import "./globals.css";
import "@copilotkit/react-ui/styles.css";
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

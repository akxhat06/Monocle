import "./globals.css";
import type { Metadata } from "next";
import OpeningAnimationHost from "@/components/OpeningAnimationHost";

export const metadata: Metadata = {
  title: "Monocle",
  description: "Conversational analytics dashboard"
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

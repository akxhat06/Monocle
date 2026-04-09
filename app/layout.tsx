import "./globals.css";
import type { Metadata } from "next";
import OpeningAnimationHost from "@/components/OpeningAnimationHost";
import { PRODUCT_DESCRIPTION, PRODUCT_LINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: PRODUCT_LINE,
  description: PRODUCT_DESCRIPTION
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

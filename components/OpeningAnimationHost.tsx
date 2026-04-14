"use client";

import { usePathname } from "next/navigation";
import OpeningAnimation from "@/components/OpeningAnimation";

/** Only show the opening animation on the login page, not after sign-in. */
export default function OpeningAnimationHost() {
  const pathname = usePathname();
  if (!pathname.startsWith("/auth")) return null;
  return <OpeningAnimation />;
}

"use client";

import OpeningAnimation from "@/components/OpeningAnimation";

/** Runs on every full load / refresh (including /auth/login) so users see the analytics splash first. */
export default function OpeningAnimationHost() {
  return <OpeningAnimation />;
}

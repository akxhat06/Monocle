"use client";

import { usePathname } from "next/navigation";
import OpeningAnimation from "@/components/OpeningAnimation";

export default function OpeningAnimationHost() {
  const pathname = usePathname();

  return <OpeningAnimation key={pathname} />;
}

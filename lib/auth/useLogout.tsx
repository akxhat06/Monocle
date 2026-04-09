"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function LogoutToast({ message }: { message: string | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !message) return null;
  return createPortal(
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-dot" aria-hidden />
      {message}
    </div>,
    document.body
  );
}

export function useLogout() {
  const router = useRouter();
  const inflightRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMsg?.startsWith("Couldn")) return;
    const id = window.setTimeout(() => setToastMsg(null), 5000);
    return () => clearTimeout(id);
  }, [toastMsg]);

  const logout = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setPending(true);
    setToastMsg("Signing out…");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setToastMsg("Signed out successfully");
      await new Promise((r) => setTimeout(r, 600));
      router.push("/auth/login");
      router.refresh();
    } catch {
      setToastMsg("Couldn't sign out. Try again.");
      setPending(false);
      inflightRef.current = false;
    }
  }, [router]);

  return {
    pending,
    logout,
    toast: <LogoutToast message={toastMsg} />,
  };
}

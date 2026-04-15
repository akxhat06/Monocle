"use client";

import { useCallback, useEffect, useRef } from "react";

type SoundName = "send" | "thinking" | "complete" | "pop" | "toggle-on" | "toggle-off";

const VOLUMES: Record<SoundName, number> = {
  "send":       0.5,
  "thinking":   0.2,
  "complete":   0.6,
  "pop":        0.4,
  "toggle-on":  0.4,
  "toggle-off": 0.4,
};

/**
 * Returns a `play(name)` function that plays the corresponding /public/*.mp3.
 * Audio objects are lazily created and cached per sound name.
 * Safe in SSR — no Audio construction until first play call.
 */
export function useSound() {
  const cache = useRef<Partial<Record<SoundName, HTMLAudioElement>>>({});
  const thinkingRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup thinking loop on unmount
    return () => { thinkingRef.current?.pause(); };
  }, []);

  const play = useCallback((name: SoundName) => {
    if (typeof window === "undefined") return;
    try {
      if (!cache.current[name]) {
        const audio = new Audio(`/${name}.mp3`);
        audio.volume = VOLUMES[name];
        if (name === "thinking") audio.loop = true;
        cache.current[name] = audio;
      }
      const audio = cache.current[name]!;
      audio.currentTime = 0;
      void audio.play().catch(() => {/* autoplay blocked — silently ignore */});
    } catch { /* ignore */ }
  }, []);

  const stop = useCallback((name: SoundName) => {
    const audio = cache.current[name];
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const startThinking = useCallback(() => play("thinking"), [play]);
  const stopThinking  = useCallback(() => stop("thinking"), [stop]);

  return { play, stop, startThinking, stopThinking };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Jellyfish from "./jellyfish";

/**
 * Deterministic pseudo-random in [0,1) from an integer seed.
 * Avoids Math.random so server and client markup match (no hydration flash).
 */
function rand(seed: number) {
  const x = Math.sin(seed * 99.13 + 7.77) * 43758.5453;
  return x - Math.floor(x);
}

type Bubble = {
  left: number;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  opacity: number;
};

const BUBBLE_COUNT = 26;

/**
 * Global animated background layer used across the whole site.
 * Renders behind all content (fixed, pointer-events: none, -z-10).
 *
 *  - Animated glowing aurora blobs (separate palette for dark / light)
 *  - Floating, gently swaying bubbles
 *  - Smoothly drifting jellyfish with scroll parallax
 */
export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();

  // Parallax offsets — each jellyfish moves at a different rate for depth.
  const yA = useTransform(scrollY, [0, 1500], [0, -140]);
  const yB = useTransform(scrollY, [0, 1500], [0, 90]);
  const yC = useTransform(scrollY, [0, 1500], [0, -200]);
  const yD = useTransform(scrollY, [0, 1500], [0, 60]);

  useEffect(() => setMounted(true), []);

  const bubbles = useMemo<Bubble[]>(() => {
    return Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
      left: rand(i + 1) * 100,
      size: 6 + rand(i + 2) * 22,
      duration: 16 + rand(i + 3) * 16,
      delay: -rand(i + 4) * 30,
      sway: 12 + rand(i + 5) * 36 * (i % 2 === 0 ? 1 : -1),
      opacity: 0.25 + rand(i + 6) * 0.4,
    }));
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* ---------------- Animated glowing aurora blobs ---------------- */}
      <div className="absolute inset-0 animate-glow-pulse">
        {/* Light mode palette */}
        <div className="dark:hidden">
          <div className="animate-aurora-1 absolute -top-32 -left-24 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.55),transparent_60%)] blur-3xl" />
          <div className="animate-aurora-2 absolute top-1/3 -right-32 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.4),transparent_60%)] blur-3xl" />
          <div className="animate-aurora-3 absolute bottom-0 left-1/4 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.4),transparent_60%)] blur-3xl" />
        </div>
        {/* Dark mode palette */}
        <div className="hidden dark:block">
          <div className="animate-aurora-1 absolute -top-40 -left-24 h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.5),transparent_60%)] blur-3xl" />
          <div className="animate-aurora-2 absolute top-1/4 -right-32 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.45),transparent_60%)] blur-3xl" />
          <div className="animate-aurora-3 absolute bottom-[-6rem] left-1/3 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.35),transparent_60%)] blur-3xl" />
        </div>
      </div>

      {/* ---------------- Floating bubbles ---------------- */}
      {mounted && (
        <div className="absolute inset-0">
          {bubbles.map((b, i) => (
            <span
              key={i}
              className="animate-bubble absolute bottom-[-40px] rounded-full"
              style={
                {
                  left: `${b.left}%`,
                  width: `${b.size}px`,
                  height: `${b.size}px`,
                  animationDuration: `${b.duration}s`,
                  animationDelay: `${b.delay}s`,
                  ["--bubble-sway" as any]: `${b.sway}px`,
                  ["--bubble-opacity" as any]: b.opacity,
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(168,139,250,0.25) 60%, rgba(124,58,237,0.05) 100%)",
                  boxShadow:
                    "inset 0 0 6px rgba(255,255,255,0.6), 0 0 10px rgba(139,92,246,0.25)",
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* ---------------- Drifting jellyfish (with parallax) ---------------- */}
      {mounted && (
        <>
          <motion.div
            className="absolute left-[6%] top-[12%] opacity-50 dark:opacity-60"
            style={{ y: yA }}
            animate={{ x: [0, 28, -12, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="animate-float-soft">
              <Jellyfish uid="a" size={130} colorFrom="#c4b5fd" colorTo="#7c3aed" />
            </div>
          </motion.div>

          <motion.div
            className="absolute right-[8%] top-[8%] opacity-40 dark:opacity-55"
            style={{ y: yB }}
            animate={{ x: [0, -22, 14, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="animate-float-soft" style={{ animationDelay: "1.2s" }}>
              <Jellyfish uid="b" size={170} colorFrom="#a5b4fc" colorTo="#4f46e5" />
            </div>
          </motion.div>

          <motion.div
            className="absolute left-[64%] top-[52%] opacity-30 dark:opacity-45"
            style={{ y: yC }}
            animate={{ x: [0, 18, -20, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="animate-float-soft" style={{ animationDelay: "2.4s" }}>
              <Jellyfish uid="c" size={96} colorFrom="#f0abfc" colorTo="#a21caf" />
            </div>
          </motion.div>

          <motion.div
            className="absolute left-[22%] top-[68%] opacity-25 dark:opacity-40"
            style={{ y: yD }}
            animate={{ x: [0, -16, 22, 0] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="animate-float-soft" style={{ animationDelay: "0.6s" }}>
              <Jellyfish uid="d" size={110} colorFrom="#67e8f9" colorTo="#0891b2" />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

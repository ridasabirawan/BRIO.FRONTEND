"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/**
 * Branded full-area loading animation — a softly pulsing Brio logo ringed by
 * orbiting glow dots. Used for route-level loading.tsx fallbacks.
 */
export default function BrioLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6">
      <div className="relative h-24 w-24">
        {/* Pulsing glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl"
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Orbiting dots */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          {[0, 120, 240].map((deg) => (
            <span
              key={deg}
              className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
              style={{
                transform: `rotate(${deg}deg) translateY(-46px)`,
              }}
            />
          ))}
        </motion.div>

        {/* Logo */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/brio-logo.png" alt="Brio" width={48} height={48} priority />
        </motion.div>
      </div>

      <motion.p
        className="text-sm font-medium text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        {label}
      </motion.p>
    </div>
  );
}

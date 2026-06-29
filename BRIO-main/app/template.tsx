"use client";

import { motion } from "framer-motion";

/**
 * App-wide page transition. Re-mounts on every navigation so each route
 * fades in smoothly. We animate opacity only (no transform/filter) so that
 * `position: fixed` descendants — the navbar and the animated background —
 * keep behaving correctly.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Bot, BarChart3, Plug, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "brio_welcome";

const FEATURES = [
  {
    icon: Bot,
    title: "Build smart chatbots",
    desc: "Train on your PDFs, docs, websites & more.",
  },
  {
    icon: BarChart3,
    title: "Track performance",
    desc: "Rich analytics on every conversation.",
  },
  {
    icon: Plug,
    title: "Embed anywhere",
    desc: "Drop it into any site with one script tag.",
  },
];

/**
 * Premium first-run welcome dialog shown when the dashboard is opened for the
 * first time. Remembers dismissal in localStorage and offers a
 * "Don't show again" opt-out.
 */
export default function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    try {
      // Permanently dismissed (checkbox) OR already seen this browser session.
      const dismissed = localStorage.getItem(STORAGE_KEY) === "dismissed";
      const seenThisSession = sessionStorage.getItem(STORAGE_KEY) === "seen";
      if (!dismissed && !seenThisSession) {
        const t = setTimeout(() => setOpen(true), 450);
        return () => clearTimeout(t);
      }
    } catch {
      /* storage unavailable — silently skip */
    }
  }, []);

  const close = () => {
    try {
      if (dontShow) {
        // "Don't show again" → never show again on this browser.
        localStorage.setItem(STORAGE_KEY, "dismissed");
      } else {
        // Otherwise just suppress it for the rest of this session.
        sessionStorage.setItem(STORAGE_KEY, "seen");
      }
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dontShow]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dim backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Animated branding glowing behind the card */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <motion.div
              className="absolute h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.45),transparent_62%)] blur-[90px]"
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute"
              animate={{ y: [-14, 14, -14], rotate: [0, 4, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/brio-logo.png"
                alt=""
                width={300}
                height={300}
                priority
                className="h-72 w-72 opacity-25 drop-shadow-[0_0_40px_rgba(139,92,246,0.6)] dark:opacity-30"
              />
            </motion.div>
          </div>

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-[0_20px_70px_-20px_rgba(124,58,237,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-950/70"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            {/* Subtle gradient sheen at the top of the card */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.20),transparent_70%)]" />

            <button
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative px-7 pt-9 text-center">
              {/* Glowing animated logo */}
              <div className="relative mx-auto mb-5 h-20 w-20">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 blur-xl"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.55, 0.9, 0.55] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/40 bg-white shadow-lg dark:border-white/15 dark:bg-neutral-900">
                  <Image src="/brio-logo.png" alt="Brio" width={46} height={46} />
                </div>
              </div>

              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                <Sparkles className="h-3 w-3" />
                Get started in minutes
              </div>

              {/* Prominent heading */}
              <h2
                id="welcome-title"
                className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
              >
                Welcome to{" "}
                <span className="text-gradient-animated">BRIO.CHAT</span>
              </h2>

              <p className="mx-auto mt-2.5 max-w-sm text-sm text-muted-foreground">
                Turn your documents, websites and data into intelligent,
                deployable chatbots — beautifully, in minutes.
              </p>
            </div>

            <div className="mt-6 space-y-2.5 px-7 text-left">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-colors hover:border-purple-400/60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">
                      {f.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 px-7 pb-7">
              <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={dontShow}
                  onChange={(e) => setDontShow(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-input accent-purple-600"
                />
                Don&apos;t show again
              </label>

              <Button
                onClick={close}
                className="glow-hover bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
              >
                Get Started
                <Sparkles className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Globe, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Renders a website source in the chat preview panel. Many sites block being
 * framed (X-Frame-Options / CSP frame-ancestors) which previously produced a
 * blank panel. We first check embeddability and either show the iframe or a
 * graceful fallback card with an "Open in new tab" action.
 */
export default function UrlViewer({ url }: { url: string }) {
  const [state, setState] = useState<"checking" | "embed" | "blocked">(
    "checking"
  );
  const [hostname, setHostname] = useState("");

  useEffect(() => {
    let cancelled = false;
    setState("checking");

    try {
      setHostname(new URL(url.startsWith("http") ? url : `https://${url}`).hostname);
    } catch {
      /* ignore */
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/preview-check?url=${encodeURIComponent(url)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (data?.hostname) setHostname(data.hostname);
        setState(data?.canEmbed ? "embed" : "blocked");
      } catch {
        if (!cancelled) setState("blocked");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state === "checking") {
    return (
      <div className="flex h-[90vh] w-full items-center justify-center bg-gray-100 dark:bg-neutral-900">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading website preview…</p>
        </div>
      </div>
    );
  }

  if (state === "embed") {
    return (
      <iframe
        src={url}
        width="100%"
        height="100%"
        style={{ minHeight: "90vh" }}
        className="bg-white"
        title={`Preview of ${hostname}`}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    );
  }

  // Blocked fallback card
  return (
    <div className="flex h-[90vh] w-full items-center justify-center bg-gray-50 p-4 dark:bg-neutral-900">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/15">
          <ShieldAlert className="h-7 w-7 text-amber-500" />
        </div>
        <div className="mb-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span className="truncate">{hostname || "Website"}</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold">
          This website can&apos;t be embedded
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          {hostname || "This site"} blocks being shown inside other pages for
          security reasons. Its content is still part of your chatbot&apos;s
          knowledge — you can open the live site in a new tab.
        </p>
        <Button asChild className="w-full">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open website in new tab
          </a>
        </Button>
      </div>
    </div>
  );
}

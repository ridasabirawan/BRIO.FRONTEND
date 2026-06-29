"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, BookOpen } from "lucide-react";
import { SourceIcon, getSourceMeta } from "@/components/source-icon";
import { cn } from "@/lib/utils";

export type ChunkSource = {
  sourceId: string | null;
  sourceName: string;
  sourceType: string;
  sourceUrl: string;
  pageNumber: number | null;
  score: number;
  snippet: string;
};

/**
 * Reads AI-SDK message annotations to find the `sources` payload attached by
 * the chat route, and renders a collapsible citation panel showing the source
 * document, file name, website URL (if any), page and the retrieved chunk.
 */
export default function SourcesPanel({
  annotations,
}: {
  annotations?: any[];
}) {
  const [open, setOpen] = useState(false);

  const ann = Array.isArray(annotations)
    ? annotations.find((a) => a && typeof a === "object" && a.type === "sources")
    : undefined;

  if (!ann) return null;

  const sources: ChunkSource[] = Array.isArray(ann.sources) ? ann.sources : [];
  if (sources.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-border/60 bg-background/60 text-foreground">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>
          {sources.length} source{sources.length > 1 ? "s" : ""} used
        </span>
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-2 px-3 pb-3">
          {sources.map((s, i) => {
            const meta = getSourceMeta(s.sourceType);
            const isWeb = ["url", "sitemap", "yt"].includes(
              s.sourceType?.toLowerCase()
            );
            return (
              <div
                key={`${s.sourceId || s.sourceName}-${i}`}
                className="rounded-md border border-border/50 bg-card/50 p-2.5"
              >
                <div className="flex items-center gap-2">
                  <SourceIcon type={s.sourceType} />
                  <span className="truncate text-sm font-medium" title={s.sourceName}>
                    {s.sourceName}
                  </span>
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {Math.round(s.score * 100)}% match
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="uppercase tracking-wide">{meta.label}</span>
                  {!isWeb && s.pageNumber ? (
                    <span>Page {s.pageNumber}</span>
                  ) : null}
                  {isWeb && s.sourceUrl ? (
                    <a
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sky-500 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="max-w-[220px] truncate">{s.sourceUrl}</span>
                    </a>
                  ) : null}
                </div>

                {s.snippet ? (
                  <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground/90">
                    “{s.snippet}…”
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

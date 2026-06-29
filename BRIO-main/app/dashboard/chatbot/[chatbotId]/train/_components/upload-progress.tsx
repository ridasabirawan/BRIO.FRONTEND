"use client";

import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { UploadStage } from "@/utils/hooks/use-source-upload";

/**
 * Visualises the upload → embedding → indexing pipeline for a single source.
 */
export default function UploadProgress({
  stage,
  progress,
}: {
  stage: UploadStage;
  progress: number;
}) {
  if (stage === "idle") return null;

  if (stage === "error") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Upload failed. Please try again.
      </div>
    );
  }

  const steps = [
    { key: "uploading", label: "Uploading" },
    { key: "processing", label: "Embedding" },
    { key: "done", label: "Indexed" },
  ];

  const activeIndex =
    stage === "uploading" ? 0 : stage === "processing" ? 1 : 2;

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <Progress value={stage === "uploading" ? progress : 100} className="h-2" />

      <div className="flex items-center justify-between text-xs">
        {steps.map((s, i) => {
          const isActive = i === activeIndex && stage !== "done";
          const isComplete = i < activeIndex || stage === "done";
          return (
            <div
              key={s.key}
              className={`flex items-center gap-1 ${
                isComplete
                  ? "text-green-600 dark:text-green-400"
                  : isActive
                  ? "text-purple-600 dark:text-purple-400 font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-current" />
              )}
              {s.label}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {stage === "uploading"
          ? `Uploading file… ${progress}%`
          : stage === "processing"
          ? "Generating embeddings & indexing…"
          : "Done!"}
      </p>
    </div>
  );
}

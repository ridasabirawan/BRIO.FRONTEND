"use client";

import { useCallback, useState } from "react";
import axios from "axios";
import { uploadToS3 } from "@/utils/s3";

export type UploadStage =
  | "idle"
  | "uploading"
  | "processing"
  | "done"
  | "error";

/**
 * Shared upload pipeline for file-backed knowledge sources:
 *   1. get a presigned S3 URL
 *   2. PUT the file to S3 (with real upload progress)
 *   3. POST to the ingest backend to start embedding + indexing
 *
 * Exposes live `progress` (0-100 for the S3 upload) and a `stage` so dialogs can
 * show "Uploading 42%" → "Processing & indexing…".
 */
export function useSourceUpload(chatbotId: string, userId?: string) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<UploadStage>("idle");

  const reset = useCallback(() => {
    setProgress(0);
    setStage("idle");
  }, []);

  const uploadFile = useCallback(
    async (file: File, type: string) => {
      setStage("uploading");
      setProgress(0);

      try {
        // 1. Presigned URL
        const { uploadUrl, file_key, file_name } = await uploadToS3({
          fileName: file.name,
          fileType: file.type,
          chatbotId,
        });

        // 2. Upload to S3 with progress
        await axios.put(uploadUrl, file, {
          headers: { "Content-Type": file.type },
          onUploadProgress: (e) => {
            if (e.total) {
              setProgress(Math.round((e.loaded * 100) / e.total));
            }
          },
        });
        setProgress(100);

        // 3. Kick off embedding + indexing on the ingest backend
        setStage("processing");
        await axios.post(process.env.NEXT_PUBLIC_BRIO_INGEST_BACKEND!, {
          file_key,
          file_name,
          type,
          userId,
          chatbotId,
        });

        setStage("done");
        return { file_key, file_name };
      } catch (error) {
        setStage("error");
        throw error;
      }
    },
    [chatbotId, userId]
  );

  return {
    uploadFile,
    progress,
    stage,
    reset,
    isBusy: stage === "uploading" || stage === "processing",
  };
}

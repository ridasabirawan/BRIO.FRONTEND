"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader, Image as ImageIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { updateTokens } from "@/drizzle/queries/update";
import { useSourceUpload } from "@/utils/hooks/use-source-upload";
import UploadProgress from "./upload-progress";

export default function ImageUploadDialog() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const session = useSession();

  const { uploadFile, progress, stage, isBusy, reset } = useSourceUpload(
    params.chatbotId as string,
    session.data?.user.id
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      if (selectedFile.size > 4 * 1024 * 1024) {
        toast.error("File size exceeds 4MB limit.");
        return;
      }
      setFile(selectedFile);
    } else {
      toast.error("Please select an image file.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleSubmit = async () => {
    if (!file) return;
    try {
      // Upload first, then debit tokens — so a failed upload doesn't charge.
      await uploadFile(file, "img");
      await updateTokens(session?.data?.user.id || "");
      toast.success(
        "Your image is being processed! Please don't close the app."
      );
      setFile(null);
      setIsOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["sources", params.chatbotId] });
    } catch (error) {
      console.error(error);
      toast.error("Error adding image");
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <div className="flex flex-col items-center cursor-pointer group">
          <div className="size-20 sm:size-24 border border-border rounded-lg flex flex-col items-center justify-center transition-all duration-300 group-hover:shadow-md group-hover:border-purple-600">
            <ImageIcon
              className="w-6 h-6 sm:w-8 sm:h-8 text-foreground transition-transform duration-300 group-hover:scale-110"
              strokeWidth={0.9}
            />

            <span className="mt-2 text-xs sm:text-sm font-medium text-foreground">
              Image
            </span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground mb-2">
            Note: Image to text will consume 1000 tokens.
          </p>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 cursor-pointer text-center transition-colors ${isDragActive
              ? "border-purple-500 bg-purple-50/50"
              : "border-gray-300"
              }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <ImageIcon className="mb-4" strokeWidth={0.9} />
                <p className="text-sm text-muted-foreground">{file.name}</p>
              </div>
            ) : isDragActive ? (
              <div className="text-purple-500 text-center">
                <p className="text-sm font-medium">Drop the file here</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ImageIcon className="mb-4" />
                <p className="text-sm text-muted-foreground mb-1 text-center">
                  Drag & drop an image file here, or click to select
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Maximum file size: 4mb
                </p>
              </div>
            )}
          </div>

          <UploadProgress stage={stage} progress={progress} />
        </div>
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={!file || isBusy}
          variant="custom"
        >
          {isBusy ? (
            <>
              <Loader className="animate-spin w-4 h-4 mr-2" />
              {stage === "uploading" ? "Uploading…" : "Processing…"}
            </>
          ) : (
            "Upload Image"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

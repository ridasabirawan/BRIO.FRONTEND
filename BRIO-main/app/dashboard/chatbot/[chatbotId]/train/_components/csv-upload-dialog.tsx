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
import { FileSpreadsheet, Loader } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useSourceUpload } from "@/utils/hooks/use-source-upload";
import UploadProgress from "./upload-progress";

export default function CSVUploadDialog() {
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
    if (selectedFile && selectedFile.type === "text/csv") {
      if (selectedFile.size > 4 * 1024 * 1024) {
        // Limit file size to 4MB
        toast.error("File size exceeds 4MB limit.");
        return;
      }
      setFile(selectedFile);
    } else {
      toast.error("Please select a CSV file.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const handleSubmit = async () => {
    if (!file) return;
    try {
      await uploadFile(file, "csv");
      toast.success("CSV added to knowledge base!");
      setFile(null);
      setIsOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["sources", params.chatbotId] });
    } catch (error) {
      console.error(error);
      toast.error("Error adding CSV");
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <div className="flex flex-col items-center cursor-pointer group">
          <div className="size-20 sm:size-24 border border-border rounded-lg flex flex-col items-center justify-center transition-all duration-300 group-hover:shadow-md group-hover:border-purple-600">
            <FileSpreadsheet
              className="w-6 h-6 sm:w-8 sm:h-8 text-foreground transition-transform duration-300 group-hover:scale-110"
              strokeWidth={0.8}
            />
            <span className="mt-2 text-xs sm:text-sm font-medium text-foreground">
              CSV
            </span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload CSV</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 cursor-pointer text-center transition-colors ${isDragActive
                ? "border-purple-500 bg-purple-50"
                : "border-gray-300"
              }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <p className="text-sm text-muted-foreground">{file.name}</p>
            ) : isDragActive ? (
              <p className="text-sm text-muted-foreground">
                Drop the file here
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drag & drop a CSV file here, or click to select
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file for the bot to learn from
          </p>

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
            "Upload"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

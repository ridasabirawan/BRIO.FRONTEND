"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import SitemapIcon from "@/public/sitemap.png";
import { LinkIcon, Loader } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";

export default function SitemapInputDialog() {
  const params = useParams();
  const queryClient = useQueryClient();
  const session = useSession();
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async (url: string) => {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_BRIO_INGEST_BACKEND!,
        {
          file_key: url,
          file_name: url,
          content: url,
          type: "sitemap",
          userId: session.data?.user.id,
          chatbotId: params.chatbotId,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success(
        "Crawling your sitemap! Pages are being processed in the background."
      );
      setSitemapUrl("");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["sources", params.chatbotId] });
    },
    onError: (err) => {
      toast.error("Error adding sitemap");
      console.error(err);
    },
  });

  const handleSubmit = () => {
    const url = sitemapUrl.trim();
    if (!url) return;
    mutate(url);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        setIsOpen(o);
        if (!o) setSitemapUrl("");
      }}
    >
      <DialogTrigger asChild>
        <div className="flex flex-col items-center cursor-pointer group">
          <div className="size-20 sm:size-24 border border-border rounded-lg flex flex-col items-center justify-center transition-all duration-300 group-hover:shadow-md group-hover:border-purple-600">
            <Image
              src={SitemapIcon}
              alt="Sitemap Icon"
              width={50}
              height={50}
              className="w-6 h-6 sm:w-8 sm:h-8 dark:invert transition-transform duration-300 group-hover:scale-110"
            />
            <span className="mt-2 text-xs sm:text-sm font-medium text-foreground">
              Sitemap
            </span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Sitemap URL</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              type="url"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              placeholder="https://example.com/sitemap.xml"
              className="flex-grow"
              disabled={isPending}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Enter a sitemap URL to crawl. Up to 20 pages will be added to your
            knowledge base.
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={!sitemapUrl.trim() || isPending}
          variant="custom"
        >
          {isPending ? (
            <>
              <Loader className="animate-spin w-4 h-4 mr-2" />
              Submitting…
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

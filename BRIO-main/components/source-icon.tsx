import {
  FileText,
  FileType2,
  Table2,
  Image as ImageIcon,
  Presentation,
  Link as LinkIcon,
  Youtube,
  Network,
  StickyNote,
  File,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Single source of truth mapping a kb_source `type` to a themable icon + label.
 * Uses lucide icons (currentColor) so they stay visible in BOTH light and dark
 * mode — unlike the old PNG icons that relied on `dark:invert`.
 */
const MAP: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  pdf: { icon: FileText, label: "PDF", color: "text-red-500" },
  docx: { icon: FileType2, label: "Word", color: "text-blue-500" },
  doc: { icon: FileType2, label: "Word", color: "text-blue-500" },
  txt: { icon: FileText, label: "Text", color: "text-zinc-500" },
  text: { icon: StickyNote, label: "Note", color: "text-amber-500" },
  csv: { icon: Table2, label: "CSV", color: "text-green-600" },
  pptx: { icon: Presentation, label: "PPTX", color: "text-orange-500" },
  ppt: { icon: Presentation, label: "PPT", color: "text-orange-500" },
  img: { icon: ImageIcon, label: "Image", color: "text-fuchsia-500" },
  url: { icon: LinkIcon, label: "Website", color: "text-sky-500" },
  sitemap: { icon: Network, label: "Sitemap", color: "text-indigo-500" },
  yt: { icon: Youtube, label: "YouTube", color: "text-red-600" },
};

export function getSourceMeta(type: string) {
  return MAP[type?.toLowerCase()] || { icon: File, label: type?.toUpperCase() || "FILE", color: "text-zinc-500" };
}

export function SourceIcon({
  type,
  className,
  colored = true,
}: {
  type: string;
  className?: string;
  colored?: boolean;
}) {
  const { icon: Icon, color } = getSourceMeta(type);
  return (
    <Icon
      className={cn("h-4 w-4 shrink-0", colored ? color : "text-foreground", className)}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}

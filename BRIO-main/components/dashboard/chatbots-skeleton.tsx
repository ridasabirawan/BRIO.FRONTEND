import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton grid shown while the user's chatbots load.
 * Mirrors the real ChatbotCard layout so the swap-in is seamless.
 */
export default function ChatbotsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer min-h-[130px] rounded-lg border bg-card/60 p-4 backdrop-blur-sm"
        >
          <div className="mb-6 flex items-start justify-between">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-5 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

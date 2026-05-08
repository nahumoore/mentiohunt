import { cn } from "@/lib/utils";

interface YoutubeVideoProps {
  id: string;
  title?: string;
  className?: string;
}

export function YoutubeVideo({
  id,
  title = "YouTube video player",
  className,
}: YoutubeVideoProps) {
  return (
    <div
      className={cn(
        "relative my-8 w-full overflow-hidden rounded-xl border border-zinc-100/50 bg-muted/30 shadow-lg",
        className
      )}
    >
      <div className="relative aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 h-full w-full border-0"
        />
      </div>
    </div>
  );
}

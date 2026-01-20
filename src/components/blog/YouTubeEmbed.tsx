import { useState } from "react";
import { Play } from "lucide-react";

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

// Extract YouTube video ID from various URL formats
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function YouTubeEmbed({ url, title }: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoId = getYouTubeId(url);

  if (!videoId) {
    return null;
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-dark shadow-lg">
      {!isLoaded ? (
        // Thumbnail with play button (lazy loading)
        <button
          onClick={() => setIsLoaded(true)}
          className="w-full h-full relative group cursor-pointer"
          aria-label={`Play video: ${title || "YouTube video"}`}
        >
          <img
            src={thumbnailUrl}
            alt={title || "Video thumbnail"}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback to standard quality thumbnail if maxres doesn't exist
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-dark/30 group-hover:bg-dark/20 transition-colors" />
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-full flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>
        </button>
      ) : (
        // Actual iframe
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title || "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      )}
    </div>
  );
}

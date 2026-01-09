import { useState, useMemo } from "react";
import { Package, Play, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ProductMediaGalleryProps {
  images: string[] | null;
  videoUrl: string | null;
  productName: string;
}

interface MediaItem {
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
}

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Get YouTube thumbnail URL
const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

// Get privacy-enhanced embed URL
const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
};

export const ProductMediaGallery = ({ images, videoUrl, productName }: ProductMediaGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Build media items array (images + video)
  const mediaItems = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = [];
    
    // Add images
    if (images && images.length > 0) {
      images.forEach((url) => {
        items.push({ type: "image", url });
      });
    }
    
    // Add video if valid YouTube URL
    if (videoUrl) {
      const videoId = getYouTubeVideoId(videoUrl);
      if (videoId) {
        items.push({
          type: "video",
          url: getYouTubeEmbedUrl(videoId),
          thumbnailUrl: getYouTubeThumbnail(videoId),
        });
      }
    }
    
    return items;
  }, [images, videoUrl]);

  const currentItem = mediaItems[selectedIndex];

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
    // If video is selected, open modal
    if (mediaItems[index].type === "video") {
      setIsVideoModalOpen(true);
    }
  };

  const handleMainClick = () => {
    if (currentItem?.type === "video") {
      setIsVideoModalOpen(true);
    }
  };

  if (mediaItems.length === 0) {
    return (
      <div className="space-y-4">
        <div className="aspect-square rounded-3xl bg-muted flex items-center justify-center">
          <Package className="w-32 h-32 text-muted-foreground/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Preview */}
      <div 
        className="aspect-square rounded-3xl overflow-hidden bg-muted relative cursor-pointer group"
        onClick={handleMainClick}
      >
        {currentItem.type === "image" ? (
          <img
            src={currentItem.url}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <>
            {/* Video Thumbnail with Play Button */}
            <img
              src={currentItem.thumbnailUrl}
              alt={`${productName} - Video`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-primary ml-1" fill="currentColor" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {mediaItems.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {mediaItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                selectedIndex === index 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <img
                src={item.type === "image" ? item.url : item.thumbnailUrl}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-4 h-4 text-primary ml-0.5" fill="currentColor" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden bg-black border-0">
          <VisuallyHidden>
            <DialogTitle>{productName} - Product Video</DialogTitle>
          </VisuallyHidden>
          <button
            onClick={() => setIsVideoModalOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="aspect-video w-full">
            {currentItem?.type === "video" && isVideoModalOpen && (
              <iframe
                src={currentItem.url}
                title={`${productName} - Product Video`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

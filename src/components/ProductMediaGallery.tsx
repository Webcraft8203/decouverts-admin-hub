import { useState, useMemo } from "react";
import { Package, Play, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
        <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          <Package className="w-24 h-24 text-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Main Preview */}
      <div 
        className="group relative aspect-square overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 cursor-zoom-in"
        onClick={handleMainClick}
      >
        <AnimatePresence mode="wait">
          {currentItem.type === "image" ? (
            <motion.div
              key={`image-${selectedIndex}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-full flex items-center justify-center p-6 bg-white"
            >
              <img
                src={currentItem.url}
                alt={`${productName} - View ${selectedIndex + 1}`}
                className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </motion.div>
          ) : (
            <motion.div
              key="video-thumbnail"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-full relative"
            >
              {/* Video Thumbnail with Play Button */}
              <img
                src={currentItem.thumbnailUrl}
                alt={`${productName} - Video`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Zoom Hint */}
        {currentItem.type === "image" && (
          <div className="absolute bottom-4 right-4 p-2.5 bg-white/80 backdrop-blur-md border border-white/20 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none z-10">
            <ZoomIn className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {mediaItems.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x px-1">
          {mediaItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                "relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 snap-start",
                selectedIndex === index 
                  ? "border-orange-600 ring-2 ring-orange-600/20 shadow-md" 
                  : "border-slate-100 hover:border-orange-600/50 opacity-80 hover:opacity-100"
              )}
            >
              <img
                src={item.type === "image" ? item.url : item.thumbnailUrl}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-3 h-3 text-primary ml-0.5" fill="currentColor" />
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

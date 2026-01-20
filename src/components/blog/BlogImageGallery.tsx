import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogImageGalleryProps {
  images: string[];
}

export function BlogImageGallery({ images }: BlogImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const nextImage = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % images.length);
  };

  const prevImage = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Gallery Grid */}
      <div className={cn(
        "grid gap-4",
        images.length === 1 && "grid-cols-1",
        images.length === 2 && "grid-cols-2",
        images.length >= 3 && "grid-cols-2 md:grid-cols-3"
      )}>
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className="relative group aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer"
          >
            <img
              src={image}
              alt={`Gallery image ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/40 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-8 h-8 text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-5xl w-full p-0 bg-dark border-dark-border overflow-hidden">
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-dark/50 hover:bg-dark/80 text-white"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Image */}
            {selectedIndex !== null && (
              <img
                src={images[selectedIndex]}
                alt={`Gallery image ${selectedIndex + 1}`}
                className="w-full max-h-[80vh] object-contain"
              />
            )}

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-dark/50 hover:bg-dark/80 text-white h-12 w-12 rounded-full"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-dark/50 hover:bg-dark/80 text-white h-12 w-12 rounded-full"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                {/* Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-dark/70 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                  {(selectedIndex || 0) + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

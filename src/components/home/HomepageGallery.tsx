import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { X, Play, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryItem {
  id: string;
  image_url: string;
  alt_text: string | null;
  title: string;
  description: string | null;
  video_url: string | null;
  category: string | null;
  project_id: string | null;
  is_featured: boolean;
  display_order: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  manufacturing: "Manufacturing",
  "3d-printing": "3D Printing",
  drone: "Drone",
  rd: "R&D",
  prototyping: "Prototyping",
};

const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export function HomepageGallery() {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["homepage-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_images")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as GalleryItem[];
    },
  });

  const handleOpenModal = (item: GalleryItem) => {
    setSelectedItem(item);
    setShowVideo(false);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setShowVideo(false);
  };

  const navigateItem = (direction: "prev" | "next") => {
    if (!items || !selectedItem) return;
    const currentIndex = items.findIndex((item) => item.id === selectedItem.id);
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < items.length) {
      setSelectedItem(items[newIndex]);
      setShowVideo(false);
    }
  };

  const currentIndex = selectedItem ? items?.findIndex((item) => item.id === selectedItem.id) ?? -1 : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = items ? currentIndex < items.length - 1 : false;

  if (isLoading) {
    return (
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section id="gallery-section" className="py-24 px-4 bg-slate-50 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb22_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb22_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest uppercase text-primary bg-primary/10 rounded-full">
            Engineering Portfolio
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Our Work
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Explore our engineering projects, prototypes, and manufacturing capabilities.
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className={cn(
                "group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-slate-100",
                item.is_featured && "md:col-span-2 lg:col-span-2"
              )}
              onClick={() => handleOpenModal(item)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Image */}
              <div className={cn(
                "relative overflow-hidden",
                item.is_featured ? "aspect-[16/9]" : "aspect-[4/3]"
              )}>
                <img
                  src={item.image_url}
                  alt={item.alt_text || item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Video Indicator */}
                {item.video_url && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-white/80 text-sm line-clamp-2 mb-4">
                        {item.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-2 text-white text-sm font-medium">
                      View Details
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 border-t border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 line-clamp-1 mb-1">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.category && (
                    <Badge 
                      variant="secondary" 
                      className="shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-100"
                    >
                      {CATEGORY_LABELS[item.category] || item.category}
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation Arrows */}
              {hasPrev && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateItem("prev");
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {hasNext && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateItem("next");
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              <div className="flex flex-col lg:flex-row max-h-[90vh]">
                {/* Media Section */}
                <div className="lg:flex-1 bg-slate-100 relative min-h-[300px] lg:min-h-[500px]">
                  {showVideo && selectedItem.video_url ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(selectedItem.video_url)}?rel=0&modestbranding=1&showinfo=0`}
                      title={selectedItem.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="relative w-full h-full min-h-[300px] lg:min-h-[500px]">
                      <img
                        src={selectedItem.image_url}
                        alt={selectedItem.alt_text || selectedItem.title}
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                      {selectedItem.video_url && (
                        <button
                          onClick={() => setShowVideo(true)}
                          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                        >
                          <div className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-xl transition-colors">
                            <Play className="w-10 h-10 text-white ml-1" fill="white" />
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="lg:w-[380px] p-8 overflow-y-auto">
                  {selectedItem.category && (
                    <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">
                      {CATEGORY_LABELS[selectedItem.category] || selectedItem.category}
                    </Badge>
                  )}
                  
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    {selectedItem.title}
                  </h2>
                  
                  {selectedItem.description && (
                    <p className="text-slate-600 leading-relaxed mb-6">
                      {selectedItem.description}
                    </p>
                  )}

                  {selectedItem.project_id && (
                    <div className="pt-6 border-t border-slate-200">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        Project Reference
                      </p>
                      <p className="text-sm font-mono text-slate-600">
                        {selectedItem.project_id}
                      </p>
                    </div>
                  )}

                  {selectedItem.video_url && !showVideo && (
                    <button
                      onClick={() => setShowVideo(true)}
                      className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Watch Video
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

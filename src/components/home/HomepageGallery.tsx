import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [modalItem, setModalItem] = useState<GalleryItem | null>(null);
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
    setModalItem(item);
    setShowVideo(false);
  };
  const handleCloseModal = () => {
    setModalItem(null);
    setShowVideo(false);
  };
  const navigateModal = (direction: "prev" | "next") => {
    if (!items || !modalItem) return;
    const currentIdx = items.findIndex((i) => i.id === modalItem.id);
    const newIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;
    if (newIdx >= 0 && newIdx < items.length) {
      setModalItem(items[newIdx]);
      setShowVideo(false);
    }
  };
  const modalIdx = modalItem && items ? items.findIndex((i) => i.id === modalItem.id) : -1;
  const modalHasPrev = modalIdx > 0;
  const modalHasNext = items ? modalIdx < items.length - 1 : false;

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-[hsl(217,45%,9%)]">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-64 mb-10 bg-white/5" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section id="gallery-section" className="relative py-20 lg:py-28 px-4 bg-[hsl(217,45%,9%)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 lg:mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-8 bg-primary" />
            <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-primary">
              Field Journal
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-[1.1] max-w-2xl">
            A closer look at what we build.
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleOpenModal(item)}
              aria-label={`View ${item.title}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img
                src={item.image_url}
                alt={item.alt_text || item.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
              {item.video_url && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-black/45 backdrop-blur-sm border border-white/25 text-white transition-transform duration-300 group-hover:scale-110">
                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {modalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {modalHasPrev && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigateModal("prev"); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {modalHasNext && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigateModal("next"); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              <div className="flex flex-col lg:flex-row max-h-[90vh]">
                <div className="lg:flex-1 bg-slate-100 relative min-h-[300px] lg:min-h-[500px]">
                  {showVideo && modalItem.video_url ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(modalItem.video_url)}?rel=0&modestbranding=1&showinfo=0`}
                      title={modalItem.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="relative w-full h-full min-h-[300px] lg:min-h-[500px]">
                      <img
                        src={modalItem.image_url}
                        alt={modalItem.alt_text || modalItem.title}
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                      {modalItem.video_url && (
                        <button
                          onClick={() => setShowVideo(true)}
                          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                        >
                          <div className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-xl transition-colors">
                            <Play className="w-10 h-10 text-white ml-1" fill="white" />
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:w-[380px] p-8 overflow-y-auto">
                  {modalItem.category && (
                    <span className="inline-block mb-4 px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.14em] uppercase bg-primary/10 text-primary border border-primary/20">
                      {CATEGORY_LABELS[modalItem.category] || modalItem.category}
                    </span>
                  )}
                  <h2 className="text-2xl font-bold text-foreground mb-4">{modalItem.title}</h2>
                  {modalItem.description && (
                    <p className="text-muted-foreground leading-relaxed mb-6">{modalItem.description}</p>
                  )}
                  {modalItem.project_id && (
                    <div className="pt-6 border-t border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Project Reference</p>
                      <p className="text-sm font-mono text-muted-foreground">{modalItem.project_id}</p>
                    </div>
                  )}
                  {modalItem.video_url && !showVideo && (
                    <button
                      onClick={() => setShowVideo(true)}
                      className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
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

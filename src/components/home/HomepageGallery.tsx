import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Play, ChevronLeft, ChevronRight, ArrowUpRight, Maximize2 } from "lucide-react";
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
  const [activeIndex, setActiveIndex] = useState(0);
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

  // Reset if items change
  useEffect(() => {
    if (items && activeIndex >= items.length) setActiveIndex(0);
  }, [items, activeIndex]);

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
      <section className="py-20 px-4 bg-[#0b1220]">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-10 bg-white/5" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Skeleton className="lg:col-span-8 aspect-[16/10] rounded-2xl bg-white/5" />
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-[16/10] lg:aspect-[16/9] rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  const active = items[activeIndex] || items[0];
  const goPrev = () => setActiveIndex((i) => (i - 1 + items.length) % items.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % items.length);

  return (
    <section
      id="gallery-section"
      className="relative py-20 lg:py-28 px-4 bg-[#0b1220] overflow-hidden"
    >
      {/* Subtle ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 20%, rgba(255,107,0,0.10), transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 lg:mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-8"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-primary" />
              <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-primary">
                Field Journal
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-[1.1]">
              A closer look at what we build.
            </h2>
          </div>
          <div className="flex items-center gap-3 text-white/50 text-sm">
            <span className="tabular-nums font-mono text-white">
              {String(activeIndex + 1).padStart(2, "0")}
            </span>
            <span className="h-px w-8 bg-white/20" />
            <span className="tabular-nums font-mono">
              {String(items.length).padStart(2, "0")}
            </span>
          </div>
        </motion.div>

        {/* Stage layout: main viewer + thumbnail rail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Main viewer */}
          <div className="lg:col-span-8">
            <div
              onClick={() => handleOpenModal(active)}
              className="group relative w-full aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900 cursor-pointer isolate"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={active.id}
                  src={active.image_url}
                  alt={active.alt_text || active.title}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-slate-950/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent" />

              {/* Top row */}
              <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {active.category && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-medium tracking-[0.12em] uppercase bg-white/10 backdrop-blur-md text-white/90 border border-white/15">
                      {CATEGORY_LABELS[active.category] || active.category}
                    </span>
                  )}
                  {active.is_featured && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-medium tracking-[0.12em] uppercase bg-primary/90 text-white border border-primary/40">
                      Featured
                    </span>
                  )}
                </div>
                {active.video_url && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-[0.12em] bg-white/10 backdrop-blur-md text-white border border-white/15">
                    <Play className="w-3 h-3" fill="currentColor" />
                    Video
                  </span>
                )}
              </div>

              {/* Prev / Next arrows */}
              <button
                type="button"
                aria-label="Previous"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center text-white hover:bg-primary hover:border-primary transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center text-white hover:bg-primary hover:border-primary transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Bottom content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id + "-copy"}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6 lg:p-8"
                >
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white tracking-tight leading-tight text-xl sm:text-2xl lg:text-4xl">
                        {active.title}
                      </h3>
                      {active.description && (
                        <p className="mt-2 sm:mt-3 text-white/65 leading-relaxed text-sm sm:text-[15px] line-clamp-2 max-w-2xl">
                          {active.description}
                        </p>
                      )}
                    </div>
                    <span className="hidden sm:inline-flex shrink-0 w-11 h-11 rounded-full border border-white/20 items-center justify-center text-white transition-all duration-300 group-hover:bg-primary group-hover:border-primary">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mobile progress dots */}
            <div className="mt-4 flex md:hidden items-center justify-center gap-1.5">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Show ${it.title}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-white/25"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Thumbnail rail */}
          <div className="lg:col-span-4">
            {/* Desktop: vertical scrollable rail. Tablet: 2x2 grid. Mobile: horizontal scroll */}
            <div
              className={cn(
                "flex gap-3 lg:gap-4",
                "overflow-x-auto lg:overflow-x-visible",
                "lg:grid lg:grid-cols-1 lg:auto-rows-[minmax(0,1fr)]",
                "lg:h-full lg:max-h-[560px] lg:overflow-y-auto lg:pr-1",
                "snap-x snap-mandatory lg:snap-none",
                "scrollbar-thin -mx-4 px-4 lg:mx-0 lg:px-0"
              )}
            >
              {items.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      "group relative shrink-0 snap-start overflow-hidden rounded-xl border transition-all duration-300 text-left",
                      "w-[75vw] xs:w-[60vw] sm:w-[280px] lg:w-full",
                      "aspect-[16/10] lg:aspect-[16/9]",
                      isActive
                        ? "border-primary shadow-[0_0_0_1px_rgba(255,107,0,0.6),0_20px_40px_-20px_rgba(255,107,0,0.5)]"
                        : "border-white/[0.08] hover:border-white/25"
                    )}
                  >
                    <img
                      src={item.image_url}
                      alt={item.alt_text || item.title}
                      loading="lazy"
                      className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                        isActive ? "scale-[1.02]" : "opacity-70 group-hover:opacity-100 group-hover:scale-[1.03]"
                      )}
                    />
                    <div
                      className={cn(
                        "absolute inset-0 transition-opacity",
                        isActive
                          ? "bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"
                          : "bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-slate-950/20"
                      )}
                    />

                    {/* Index badge */}
                    <span className="absolute top-2.5 left-2.5 z-10 tabular-nums font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white/80 border border-white/10">
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    {/* Video pill */}
                    {item.video_url && (
                      <span className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
                        <Play className="w-2.5 h-2.5 text-white" fill="currentColor" />
                      </span>
                    )}

                    {/* Active side accent */}
                    {isActive && (
                      <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r bg-primary" />
                    )}

                    <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-white text-[13px] font-medium leading-tight truncate">
                          {item.title}
                        </p>
                        <ArrowUpRight
                          className={cn(
                            "w-3.5 h-3.5 shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-white/60"
                          )}
                        />
                      </div>
                      {item.category && (
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/50">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
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
              className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
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
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{modalItem.title}</h2>
                  {modalItem.description && (
                    <p className="text-slate-600 leading-relaxed mb-6">{modalItem.description}</p>
                  )}
                  {modalItem.project_id && (
                    <div className="pt-6 border-t border-slate-200">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Project Reference</p>
                      <p className="text-sm font-mono text-slate-600">{modalItem.project_id}</p>
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

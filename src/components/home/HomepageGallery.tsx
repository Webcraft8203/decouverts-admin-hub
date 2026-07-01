import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Play, ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
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

const BADGE_POOL = ["Made in India", "Flagship", "Mission Ready", "R&D", "New"];
const pickBadges = (item: GalleryItem, index: number): string[] => {
  const badges: string[] = [];
  if (index === 0) badges.push("Flagship");
  if (item.is_featured && index !== 0) badges.push("Mission Ready");
  badges.push("Made in India");
  return badges.slice(0, 2);
};

interface ShowcaseCardProps {
  item: GalleryItem;
  index: number;
  size: "flagship" | "large" | "regular";
  onClick: () => void;
}

function ShowcaseCard({ item, index, size, onClick }: ShowcaseCardProps) {
  const badges = pickBadges(item, index);
  const isFlagship = size === "flagship";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[24px] cursor-pointer isolate",
        "bg-slate-900 border border-slate-200/60",
        "shadow-[0_2px_20px_-8px_rgba(15,23,42,0.15)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-3 hover:shadow-[0_30px_60px_-20px_rgba(255,107,0,0.35),0_0_0_1px_rgba(255,107,0,0.2)]",
        isFlagship ? "min-h-[520px] lg:min-h-[640px]" : "min-h-[300px] lg:min-h-[310px]"
      )}
    >
      {/* Image */}
      <img
        src={item.image_url}
        alt={item.alt_text || item.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.08]"
      />

      {/* Dark cinematic gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/10" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Video play indicator */}
      {item.video_url && (
        <div className="absolute top-5 right-5 z-10">
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}

      {/* Top: badges */}
      <div className="absolute top-5 left-5 z-10 flex flex-wrap gap-2">
        {item.category && (
          <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.14em] uppercase bg-white/10 backdrop-blur-md text-white border border-white/20">
            {CATEGORY_LABELS[item.category] || item.category}
          </span>
        )}
        {badges.map((b) => (
          <span
            key={b}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.14em] uppercase backdrop-blur-md border",
              b === "Flagship"
                ? "bg-primary/90 text-white border-primary/50 shadow-[0_0_20px_rgba(255,107,0,0.5)]"
                : "bg-white/10 text-white border-white/20"
            )}
          >
            {b}
          </span>
        ))}
      </div>

      {/* Bottom content */}
      <div className={cn("absolute inset-x-0 bottom-0 z-10 p-6 lg:p-8", isFlagship && "lg:p-10")}>
        <h3
          className={cn(
            "font-bold text-white tracking-tight leading-tight mb-3",
            isFlagship ? "text-3xl md:text-4xl lg:text-5xl" : "text-xl md:text-2xl"
          )}
        >
          {item.title}
        </h3>
        {item.description && (
          <p
            className={cn(
              "text-white/70 leading-relaxed mb-5 max-w-2xl",
              isFlagship ? "text-base lg:text-lg line-clamp-2" : "text-sm line-clamp-1"
            )}
          >
            {item.description}
          </p>
        )}

        {/* Explore button */}
        <div className="inline-flex items-center gap-2 text-white font-semibold text-sm group/btn">
          <span className="relative overflow-hidden">
            <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">
              Explore
            </span>
          </span>
          <span className="relative w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:bg-primary group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(255,107,0,0.6)]">
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>

      {/* Orange accent line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center z-20" />
    </motion.article>
  );
}

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
    const currentIndex = items.findIndex((i) => i.id === selectedItem.id);
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < items.length) {
      setSelectedItem(items[newIndex]);
      setShowVideo(false);
    }
  };
  const currentIndex = selectedItem ? items?.findIndex((i) => i.id === selectedItem.id) ?? -1 : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = items ? currentIndex < items.length - 1 : false;

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 lg:row-span-2 h-[640px] rounded-[24px]" />
          <Skeleton className="h-[310px] rounded-[24px]" />
          <Skeleton className="h-[310px] rounded-[24px]" />
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  const flagship = items[0];
  const secondary = items.slice(1, 5);
  const rest = items.slice(5);

  return (
    <section
      id="gallery-section"
      className="relative py-20 lg:py-28 px-4 bg-slate-50 overflow-hidden"
    >
      {/* Engineering blueprint background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
      />

      {/* Blueprint diagonal lines */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent 0 80px, rgba(255,107,0,0.5) 80px 81px)",
        }}
      />

      {/* HUD rings */}
      <div aria-hidden className="absolute top-1/4 -left-40 w-[480px] h-[480px] rounded-full border border-primary/10 pointer-events-none animate-[spin_60s_linear_infinite]" />
      <div aria-hidden className="absolute top-1/4 -left-40 w-[480px] h-[480px] rounded-full border-2 border-dashed border-primary/5 scale-75 pointer-events-none animate-[spin_40s_linear_infinite_reverse]" />
      <div aria-hidden className="absolute bottom-0 -right-40 w-[560px] h-[560px] rounded-full border border-primary/10 pointer-events-none animate-[spin_80s_linear_infinite]" />

      {/* Glowing orange particles */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-primary/60 shadow-[0_0_20px_6px_rgba(255,107,0,0.4)] animate-pulse" />
        <div className="absolute top-[70%] left-[80%] w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_16px_5px_rgba(255,107,0,0.4)] animate-pulse [animation-delay:600ms]" />
        <div className="absolute top-[40%] left-[92%] w-1 h-1 rounded-full bg-primary/60 shadow-[0_0_12px_4px_rgba(255,107,0,0.4)] animate-pulse [animation-delay:1200ms]" />
        <div className="absolute top-[85%] left-[10%] w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_16px_5px_rgba(255,107,0,0.4)] animate-pulse [animation-delay:1800ms]" />
      </div>

      {/* Ambient radial glow */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.06),transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 lg:mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-[11px] font-semibold tracking-[0.18em] uppercase text-primary bg-primary/10 border border-primary/20 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Engineering Showcase
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.05]">
              Built for the mission.
              <br />
              <span className="text-slate-400">Engineered in India.</span>
            </h2>
          </div>
          <p className="text-slate-600 text-base lg:text-lg max-w-md leading-relaxed">
            A closer look at our flagship drone platforms, prototypes and mission-ready systems.
          </p>
        </motion.div>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {/* Flagship spans 2 cols x 2 rows */}
          <div className="lg:col-span-2 lg:row-span-2">
            <ShowcaseCard
              item={flagship}
              index={0}
              size="flagship"
              onClick={() => handleOpenModal(flagship)}
            />
          </div>

          {/* Secondary cards */}
          {secondary.map((item, i) => (
            <ShowcaseCard
              key={item.id}
              item={item}
              index={i + 1}
              size="regular"
              onClick={() => handleOpenModal(item)}
            />
          ))}
        </div>

        {/* Any remaining items in a clean row */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mt-5 lg:mt-6">
            {rest.map((item, i) => (
              <ShowcaseCard
                key={item.id}
                item={item}
                index={i + 5}
                size="regular"
                onClick={() => handleOpenModal(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedItem && (
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

              {hasPrev && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigateItem("prev"); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {hasNext && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigateItem("next"); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              <div className="flex flex-col lg:flex-row max-h-[90vh]">
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
                          <div className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-xl transition-colors">
                            <Play className="w-10 h-10 text-white ml-1" fill="white" />
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:w-[380px] p-8 overflow-y-auto">
                  {selectedItem.category && (
                    <span className="inline-block mb-4 px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.14em] uppercase bg-primary/10 text-primary border border-primary/20">
                      {CATEGORY_LABELS[selectedItem.category] || selectedItem.category}
                    </span>
                  )}
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedItem.title}</h2>
                  {selectedItem.description && (
                    <p className="text-slate-600 leading-relaxed mb-6">{selectedItem.description}</p>
                  )}
                  {selectedItem.project_id && (
                    <div className="pt-6 border-t border-slate-200">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Project Reference</p>
                      <p className="text-sm font-mono text-slate-600">{selectedItem.project_id}</p>
                    </div>
                  )}
                  {selectedItem.video_url && !showVideo && (
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

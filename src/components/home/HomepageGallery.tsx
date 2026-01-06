import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Plus, ArrowUpRight } from "lucide-react";

interface HomepageImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

export function HomepageGallery() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: images, isLoading } = useQuery({
    queryKey: ["homepage-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_images")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HomepageImage[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!images || images.length === 0) {
    return null;
  }

  const selectedImage = images.find((img) => img.id === selectedId);

  return (
    <section className="py-24 px-4 bg-slate-50 relative overflow-hidden">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_0px,rgba(255,255,255,0.8),transparent)]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-[0.2em] uppercase text-primary/80 border border-primary/20 rounded-full bg-primary/5">
            Our Projects
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Engineering <span className="text-primary">Gallery</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            A showcase of our industrial capabilities, R&D prototypes, and manufacturing excellence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              layoutId={`card-${image.id}`}
              className="group relative bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
              onClick={() => setSelectedId(image.id)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={image.image_url}
                  alt={image.alt_text || "Project Image"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-500" />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold text-slate-900 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <Plus className="w-4 h-4 text-primary" />
                    View Project
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                      Industrial R&D
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                      {image.alt_text || "Engineering Project"}
                    </h3>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {selectedId && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              layoutId={`card-${selectedId}`}
              className="relative w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 bg-slate-100">
                  <img
                    src={selectedImage.image_url}
                    alt={selectedImage.alt_text || "Project Detail"}
                    className="w-full h-full object-contain max-h-[80vh]"
                  />
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center bg-white">
                  <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest uppercase text-primary bg-primary/5 rounded-full w-fit">
                    Project Details
                  </span>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">
                    {selectedImage.alt_text || "Engineering Project"}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-8">
                    This project represents our commitment to precision engineering and innovative manufacturing solutions. Designed to meet rigorous industrial standards.
                  </p>
                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-sm text-slate-400 font-mono">ID: {selectedImage.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

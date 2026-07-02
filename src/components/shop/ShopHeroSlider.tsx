import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Check } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface ShopSlide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  product_id: string | null;
  is_visible: boolean;
  display_order: number;
}

interface Highlight {
  label: string;
  value: string;
  product_id: string;
  display_order: number;
}

interface LinkedProduct {
  id: string;
  slug: string | null;
  name: string;
  categories: { name: string } | null;
}

const AUTOPLAY_MS = 7000;

/** Cinematic gradient scenes keyed by category. Pure CSS — no assets required. */
function sceneForCategory(name: string | null | undefined) {
  const c = (name || "").toLowerCase();
  if (c.includes("agri") || c.includes("farm") || c.includes("crop")) {
    return {
      // Golden sunrise over fields
      bg: "radial-gradient(120% 80% at 70% 20%, hsl(38 92% 78% / 0.95) 0%, hsl(28 85% 62% / 0.7) 30%, hsl(18 60% 40% / 0.55) 55%, hsl(220 30% 15% / 0.85) 100%), linear-gradient(180deg, hsl(35 70% 55%) 0%, hsl(150 25% 25%) 100%)",
      accent: "hsl(38 95% 65%)",
      label: "Precision Agriculture",
    };
  }
  if (c.includes("industrial") || c.includes("inspect") || c.includes("energy")) {
    return {
      // Steel + turbine dusk
      bg: "radial-gradient(110% 75% at 25% 20%, hsl(200 60% 65% / 0.7) 0%, hsl(210 50% 40% / 0.65) 35%, hsl(220 40% 18% / 0.9) 100%), linear-gradient(180deg, hsl(210 30% 30%) 0%, hsl(220 35% 12%) 100%)",
      accent: "hsl(24 95% 60%)",
      label: "Industrial Inspection",
    };
  }
  if (c.includes("defence") || c.includes("defense") || c.includes("military") || c.includes("tactical")) {
    return {
      // Desert / tactical dusk
      bg: "radial-gradient(110% 80% at 75% 25%, hsl(30 55% 60% / 0.8) 0%, hsl(20 45% 35% / 0.7) 40%, hsl(215 40% 12% / 0.95) 100%), linear-gradient(180deg, hsl(25 40% 35%) 0%, hsl(215 45% 10%) 100%)",
      accent: "hsl(20 90% 58%)",
      label: "Defence Ready",
    };
  }
  if (c.includes("survey") || c.includes("mapping") || c.includes("gis") || c.includes("recon")) {
    return {
      // Alpine forest & mist
      bg: "radial-gradient(110% 80% at 30% 25%, hsl(160 45% 55% / 0.6) 0%, hsl(180 40% 30% / 0.7) 40%, hsl(210 50% 12% / 0.95) 100%), linear-gradient(180deg, hsl(170 35% 25%) 0%, hsl(210 45% 10%) 100%)",
      accent: "hsl(22 90% 60%)",
      label: "Survey & Mapping",
    };
  }
  if (c.includes("3d") || c.includes("print") || c.includes("additive")) {
    return {
      bg: "radial-gradient(110% 80% at 70% 20%, hsl(260 55% 65% / 0.55) 0%, hsl(230 50% 30% / 0.7) 45%, hsl(225 45% 10% / 0.95) 100%), linear-gradient(180deg, hsl(240 30% 22%) 0%, hsl(225 45% 8%) 100%)",
      accent: "hsl(24 95% 60%)",
      label: "Additive Manufacturing",
    };
  }
  // Default cinematic aerospace
  return {
    bg: "radial-gradient(120% 80% at 65% 20%, hsl(24 90% 62% / 0.55) 0%, hsl(215 55% 25% / 0.7) 40%, hsl(220 50% 8% / 0.95) 100%), linear-gradient(180deg, hsl(215 35% 20%) 0%, hsl(220 50% 6%) 100%)",
    accent: "hsl(24 95% 60%)",
    label: "Aerial Platform",
  };
}

export function ShopHeroSlider() {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  const { data: slides, isLoading } = useQuery({
    queryKey: ["shop-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_slides")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ShopSlide[];
    },
  });

  const productIds = useMemo(
    () => (slides || []).map((s) => s.product_id).filter(Boolean) as string[],
    [slides]
  );

  const { data: linkedProducts } = useQuery({
    queryKey: ["shop-slides-products", productIds.sort().join(",")],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, categories(name)")
        .in("id", productIds);
      return (data || []) as unknown as LinkedProduct[];
    },
  });

  const { data: highlights } = useQuery({
    queryKey: ["shop-slides-highlights", productIds.sort().join(",")],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_highlights")
        .select("product_id, label, value, display_order")
        .in("product_id", productIds)
        .order("display_order", { ascending: true });
      return (data || []) as Highlight[];
    },
  });

  useEffect(() => {
    if (!api) return;
    const sync = () => {
      setCurrent(api.selectedScrollSnap());
      setProgressKey((k) => k + 1);
    };
    sync();
    api.on("select", sync);
    return () => {
      api.off("select", sync);
    };
  }, [api]);

  if (isLoading) {
    return (
      <section className="bg-secondary/20">
        <Skeleton className="w-full h-[560px] lg:h-[680px]" />
      </section>
    );
  }

  if (!slides || slides.length === 0) return null;

  const activeSlide = slides[current];
  const activeProduct = linkedProducts?.find(
    (p) => p.id === activeSlide?.product_id
  );
  const scene = sceneForCategory(activeProduct?.categories?.name);

  const activeSpecs = (highlights || [])
    .filter((h) => h.product_id === activeSlide?.product_id)
    .slice(0, 3);

  return (
    <section
      className="relative overflow-hidden"
      aria-label="Featured platforms"
    >
      {/* Cinematic backdrop layer — animates on slide change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${activeSlide?.id}-${current}`}
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
          style={{ background: scene.bg }}
        />
      </AnimatePresence>

      {/* Blurred product image as ambient background for organic depth */}
      <AnimatePresence mode="wait">
        {activeSlide?.image_url && (
          <motion.div
            key={`amb-${activeSlide.id}-${current}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${activeSlide.image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(40px) saturate(1.1)",
              transform: "scale(1.15)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Warm cinematic light + readability wash */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, hsl(220 50% 6% / 0.55) 0%, hsl(220 50% 6% / 0.25) 45%, transparent 70%), radial-gradient(60% 50% at 80% 30%, hsl(24 95% 60% / 0.18) 0%, transparent 60%)",
        }}
      />
      {/* Grain / vignette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, hsl(220 60% 4% / 0.7) 100%)",
        }}
      />

      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={[
          Autoplay({
            delay: AUTOPLAY_MS,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
        className="relative"
      >
        <CarouselContent>
          {slides.map((slide, idx) => {
            const product = linkedProducts?.find(
              (p) => p.id === slide.product_id
            );
            const slideScene = sceneForCategory(
              product?.categories?.name
            );
            const specs = (highlights || [])
              .filter((h) => h.product_id === slide.product_id)
              .slice(0, 3);

            return (
              <CarouselItem key={slide.id}>
                <div className="relative w-full min-h-[600px] lg:min-h-[700px] flex items-center">
                  <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-8 items-center">
                      {/* LEFT — copy (40%) */}
                      {idx === current && (
                        <div className="lg:col-span-2 relative">
                          <motion.div
                            key={`badge-${slide.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.05 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full animate-pulse"
                              style={{ background: slideScene.accent }}
                            />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
                              {product?.categories?.name || slideScene.label}
                            </span>
                          </motion.div>

                          <motion.h1
                            key={`title-${slide.id}`}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.7,
                              delay: 0.15,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-tight leading-[1.02]"
                          >
                            {slide.title}
                          </motion.h1>

                          {slide.description && (
                            <motion.p
                              key={`desc-${slide.id}`}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.65, delay: 0.3 }}
                              className="mt-5 text-base sm:text-lg text-white/70 max-w-lg leading-relaxed"
                            >
                              {slide.description}
                            </motion.p>
                          )}

                          {specs.length > 0 && (
                            <motion.ul
                              key={`specs-${slide.id}`}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: 0.42 }}
                              className="mt-7 flex flex-wrap gap-x-6 gap-y-2"
                            >
                              {specs.map((s) => (
                                <li
                                  key={`${s.label}-${s.value}`}
                                  className="flex items-center gap-2 text-sm text-white/85"
                                >
                                  <Check
                                    className="w-4 h-4"
                                    style={{ color: slideScene.accent }}
                                  />
                                  <span className="font-medium">
                                    {s.value}
                                  </span>
                                  <span className="text-white/55">
                                    {s.label}
                                  </span>
                                </li>
                              ))}
                            </motion.ul>
                          )}

                          <motion.div
                            key={`cta-${slide.id}`}
                            initial="hidden"
                            animate="show"
                            variants={{
                              hidden: {},
                              show: {
                                transition: { staggerChildren: 0.12, delayChildren: 0.55 },
                              },
                            }}
                            className="mt-8 flex flex-wrap items-center gap-3"
                          >
                            <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                show: { opacity: 1, y: 0 },
                              }}
                            >
                              <Button
                                onClick={() => {
                                  if (product?.slug || slide.product_id) {
                                    navigate(
                                      `/product/${product?.slug || slide.product_id}`
                                    );
                                  } else {
                                    document
                                      .getElementById("shop-catalogue")
                                      ?.scrollIntoView({ behavior: "smooth" });
                                  }
                                }}
                                className="h-11 px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-lg shadow-primary/30 group transition-all hover:shadow-primary/50 hover:-translate-y-0.5"
                              >
                                Explore Platform
                                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                              </Button>
                            </motion.div>
                            <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                show: { opacity: 1, y: 0 },
                              }}
                            >
                              <Button
                                variant="outline"
                                onClick={() =>
                                  navigate(
                                    `/contact${product ? `?product=${encodeURIComponent(product.name)}` : ""}`
                                  )
                                }
                                className="h-11 px-6 rounded-full border-white/30 bg-white/5 backdrop-blur-md text-white hover:bg-white/15 hover:border-white/50 font-medium text-sm"
                              >
                                Get Quote
                              </Button>
                            </motion.div>
                          </motion.div>
                        </div>
                      )}
                      {idx !== current && <div className="lg:col-span-2" />}

                      {/* RIGHT — drone stage (60%) */}
                      <div className="lg:col-span-3 relative">
                        <div className="relative w-full aspect-[5/4] max-h-[560px] mx-auto flex items-center justify-center">
                          {/* soft glow behind drone */}
                          <div
                            aria-hidden
                            className="absolute inset-[10%] rounded-full blur-3xl opacity-60"
                            style={{
                              background: `radial-gradient(circle, ${slideScene.accent} 0%, transparent 65%)`,
                              opacity: 0.35,
                            }}
                          />
                          {idx === current && (
                            <motion.img
                              key={`img-${slide.id}`}
                              src={slide.image_url}
                              alt={slide.title}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{
                                opacity: 1,
                                y: [0, -10, 0],
                              }}
                              transition={{
                                opacity: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                                y: {
                                  duration: 6,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                },
                              }}
                              className="relative z-10 w-[80%] max-w-[560px] h-auto object-contain drop-shadow-[0_35px_45px_rgba(0,0,0,0.55)]"
                            />
                          )}
                          {idx !== current && (
                            <img
                              src={slide.image_url}
                              alt=""
                              aria-hidden
                              className="relative z-10 w-[80%] max-w-[560px] h-auto object-contain opacity-0"
                            />
                          )}

                          {/* Ground shadow */}
                          <motion.div
                            aria-hidden
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 h-4 w-3/5 rounded-full bg-black/50 blur-2xl"
                            animate={{
                              scaleX: [1, 0.88, 1],
                              opacity: [0.5, 0.7, 0.5],
                            }}
                            transition={{
                              duration: 6,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />

                          {/* Floating spec cards — 3 max */}
                          {idx === current && specs.length > 0 && (
                            <div className="hidden md:block">
                              {specs.map((s, i) => {
                                const positions = [
                                  { top: "8%", left: "-2%" },
                                  { top: "48%", right: "-4%" },
                                  { bottom: "10%", left: "6%" },
                                ];
                                const pos = positions[i] || positions[0];
                                return (
                                  <motion.div
                                    key={`float-${s.label}`}
                                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                                    animate={{
                                      opacity: 1,
                                      y: [0, -6, 0],
                                      scale: 1,
                                    }}
                                    transition={{
                                      opacity: { duration: 0.6, delay: 0.7 + i * 0.15 },
                                      scale: { duration: 0.6, delay: 0.7 + i * 0.15 },
                                      y: {
                                        duration: 5 + i,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 0.4,
                                      },
                                    }}
                                    className="absolute z-20 px-4 py-2.5 rounded-2xl border border-white/25 bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/30"
                                    style={pos}
                                  >
                                    <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">
                                      {s.label}
                                    </div>
                                    <div className="mt-0.5 text-base font-semibold text-white">
                                      {s.value}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* Circular glass nav */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => api?.scrollPrev()}
              className="hidden sm:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 hover:border-primary/60 hover:shadow-[0_0_25px_hsl(24_95%_60%/0.5)] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => api?.scrollNext()}
              className="hidden sm:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 hover:border-primary/60 hover:shadow-[0_0_25px_hsl(24_95%_60%/0.5)] transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Progress bar indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="h-1 w-10 rounded-full bg-white/25 overflow-hidden"
                >
                  {i === current && (
                    <motion.span
                      key={`prog-${progressKey}`}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                      className="block h-full bg-primary"
                    />
                  )}
                  {i < current && <span className="block h-full w-full bg-primary/70" />}
                </button>
              ))}
            </div>
          </>
        )}
      </Carousel>
    </section>
  );
}

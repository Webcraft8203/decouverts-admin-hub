import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface Partner {
  id: string;
  partner_name: string;
  logo_url: string;
  image_title: string;
  image_description: string;
  website_url: string | null;
  is_featured?: boolean;
}

export const OurPartners = () => {
  const { data: partners, isLoading } = useQuery({
    queryKey: ["published-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Partner[];
    },
  });

  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  // Auto-scroll with rAF for smooth infinite marquee
  // Only enable infinite marquee when we have enough partners that the
  // cloned set will remain off-screen; otherwise show a single centered row.
  const shouldLoop = (partners?.length ?? 0) >= 6;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !partners?.length || !shouldLoop) return;

    let rafId: number;
    let lastTime = performance.now();
    const speed = 40; // px per second (slow)

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (!isPaused && !isDragging) {
        track.scrollLeft += speed * dt;
        const half = track.scrollWidth / 2;
        if (track.scrollLeft >= half) track.scrollLeft -= half;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [partners, isPaused, isDragging, shouldLoop]);

  if (isLoading) {
    return (
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse h-8 bg-slate-100 rounded w-64 mx-auto mb-4" />
          <div className="animate-pulse h-4 bg-slate-100 rounded w-96 mx-auto" />
        </div>
      </section>
    );
  }

  if (!partners || partners.length === 0) return null;

  // Duplicate ONLY when looping (clones are needed for seamless scroll and
  // stay off-screen). Small lists render exactly once, centered.
  const displayList = shouldLoop ? [...partners, ...partners] : partners;


  const onPointerDown = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartScroll.current = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    trackRef.current.scrollLeft = dragStartScroll.current - (e.clientX - dragStartX.current);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    trackRef.current?.releasePointerCapture(e.pointerId);
  };

  const PartnerNode = ({ partner }: { partner: Partner }) => {
    const featured = !!partner.is_featured;
    const inner = (
      <div className="group flex flex-col items-center select-none">
        <div className="relative">
          {featured && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full ring-2 ring-primary/60 animate-pulse"
              style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.35)" }}
            />
          )}
          <div
            className={[
              "relative flex items-center justify-center rounded-full bg-white",
              "border border-slate-200/80 shadow-[0_6px_20px_-6px_rgba(15,23,42,0.15)]",
              "transition-all duration-300 ease-out",
              "group-hover:-translate-y-1.5 group-hover:shadow-[0_18px_40px_-12px_rgba(234,88,12,0.35)]",
              "group-hover:border-primary/60 group-hover:ring-2 group-hover:ring-primary/40",
              featured
                ? "h-[130px] w-[130px] md:h-[170px] md:w-[170px]"
                : "h-[90px] w-[90px] md:h-[110px] md:w-[110px] lg:h-[150px] lg:w-[150px]",
            ].join(" ")}
          >
            <img
              src={partner.logo_url}
              alt={partner.image_title}
              title={partner.image_title}
              loading="lazy"
              draggable={false}
              className="max-h-[55%] max-w-[70%] object-contain transition-transform duration-300 group-hover:scale-[1.08]"
            />
          </div>
        </div>
        <p className="mt-4 text-center text-[13px] md:text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors duration-300 max-w-[150px] leading-snug">
          {partner.partner_name}
        </p>
      </div>
    );

    if (partner.website_url) {
      return (
        <a
          href={partner.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 mx-4 md:mx-6"
          onClick={(e) => {
            // prevent navigation if user was dragging
            if (isDragging) e.preventDefault();
          }}
        >
          {inner}
        </a>
      );
    }
    return <div className="flex-shrink-0 mx-4 md:mx-6">{inner}</div>;
  };

  return (
    <section className="relative py-16 md:py-24 bg-white overflow-hidden">
      {/* Subtle engineering grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
      {/* Orange radial glow behind heading */}
      <div
        aria-hidden
        className="absolute left-1/2 top-8 -translate-x-1/2 w-[680px] h-[280px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.14), transparent 70%)",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1.5 mb-5 text-[10px] font-bold tracking-[0.28em] uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
            Trusted By
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Trusted By Industry & <span className="text-primary">Government</span>
          </h2>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Collaborating with defence organizations, government agencies, research
            institutes and industry leaders to build next-generation drone technologies.
          </p>
        </motion.div>
      </div>

      {/* Marquee */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div
          ref={trackRef}
          onPointerDown={shouldLoop ? onPointerDown : undefined}
          onPointerMove={shouldLoop ? onPointerMove : undefined}
          onPointerUp={shouldLoop ? onPointerUp : undefined}
          onPointerCancel={shouldLoop ? onPointerUp : undefined}
          className={[
            "flex items-start py-6",
            shouldLoop
              ? "overflow-x-hidden cursor-grab active:cursor-grabbing"
              : "justify-center flex-wrap gap-y-8 overflow-hidden",
          ].join(" ")}
          style={{ touchAction: "pan-y" }}
        >
          {displayList.map((partner, i) => (
            <PartnerNode key={`${partner.id}-${i}`} partner={partner} />
          ))}
        </div>

      </div>
    </section>
  );
};

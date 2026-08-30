import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse h-8 bg-secondary rounded w-64 mx-auto mb-4" />
          <div className="animate-pulse h-4 bg-secondary rounded w-96 mx-auto" />
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
        <div
          className={[
            "relative flex items-center justify-center rounded-full bg-white",
            "border border-border shadow-sm",
            "transition-all duration-300 ease-out",
            "group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-md",
            featured
              ? "h-[100px] w-[100px] md:h-[124px] md:w-[124px]"
              : "h-[76px] w-[76px] md:h-[88px] md:w-[88px] lg:h-[104px] lg:w-[104px]",
          ].join(" ")}
        >
          <img
            src={partner.logo_url}
            alt={partner.image_title}
            title={partner.image_title}
            loading="lazy"
            draggable={false}
            className="max-h-[55%] max-w-[70%] object-contain"
          />
        </div>
        <p className="mt-4 text-center text-[13px] md:text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors duration-300 max-w-[150px] leading-snug">
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
    <section className="relative py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-primary" />
            <p className="text-primary font-semibold tracking-[0.2em] text-xs uppercase">Trusted By</p>
            <span className="h-px w-10 bg-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
            Trusted By Industry &amp; Government
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Collaborating with defence organizations, government agencies, research
            institutes and industry leaders to build next-generation drone technologies.
          </p>
        </div>
      </div>

      {/* Marquee */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />


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

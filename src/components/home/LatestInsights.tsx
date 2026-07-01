import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ORANGE = "#FF6B00";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  feature_image: string | null;
  content_type: string;
  publish_date: string | null;
  created_at: string;
  tags: string[] | null;
};

const categoryLabel = (type: string, tags: string[] | null) => {
  const t = (tags || []).map((x) => x.toLowerCase());
  if (t.includes("press") || t.includes("press release")) return "Press";
  if (t.includes("case study") || t.includes("case-study")) return "Case Study";
  if (t.includes("product launch") || t.includes("launch")) return "Product Launch";
  if (t.includes("research")) return "Research";
  if (t.includes("update") || t.includes("company update")) return "Company Update";
  return type === "news" ? "News" : "Blog";
};

export function LatestInsights() {
  const { data: posts } = useQuery({
    queryKey: ["latest-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,feature_image,content_type,publish_date,created_at,tags")
        .eq("status", "published")
        .order("publish_date", { ascending: false })
        .limit(16);
      if (error) throw error;
      return (data || []) as Post[];
    },
  });

  const items = posts || [];
  // Duplicate for seamless infinite loop
  const loop = items.length > 0 ? [...items, ...items] : [];

  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const lastTimeRef = useRef<number | null>(null);

  // Drag state
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const SPEED = 40; // px/sec

  const applyTransform = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }
  }, []);

  const measure = useCallback(() => {
    if (!trackRef.current) return;
    halfWidthRef.current = trackRef.current.scrollWidth / 2;
  }, []);

  useEffect(() => {
    if (loop.length === 0) return;
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const tick = (t: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = t;
      const dt = (t - lastTimeRef.current) / 1000;
      lastTimeRef.current = t;
      if (!pausedRef.current && !draggingRef.current && halfWidthRef.current > 0) {
        offsetRef.current += SPEED * dt;
        if (offsetRef.current >= halfWidthRef.current) offsetRef.current -= halfWidthRef.current;
        if (offsetRef.current < 0) offsetRef.current += halfWidthRef.current;
        applyTransform();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [loop.length, applyTransform, measure]);

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    let next = dragStartOffsetRef.current - dx;
    const w = halfWidthRef.current || 1;
    next = ((next % w) + w) % w;
    offsetRef.current = next;
    applyTransform();
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <section
      id="latest-insights"
      className="relative overflow-hidden bg-white py-28 lg:py-36"
    >
      {/* Engineering grid @ 3% */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: 0.03,
          maskImage:
            "radial-gradient(ellipse at 50% 40%, black 45%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 40%, black 45%, transparent 85%)",
        }}
      />
      {/* Soft orange radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[700px] w-[1100px] -translate-x-1/2 -translate-y-1/3 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,107,0,0.10) 0%, rgba(255,107,0,0) 70%)",
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="mx-auto mb-20 max-w-4xl px-6 text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]"
            style={{
              borderColor: "rgba(255,107,0,0.35)",
              color: ORANGE,
              background: "rgba(255,107,0,0.06)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: ORANGE }}
            />
            Latest Insights
          </span>
          <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 md:text-5xl lg:text-[56px]">
            Engineering Stories.{" "}
            <span className="text-slate-500">Product Updates.</span>{" "}
            <span style={{ color: ORANGE }}>Industry News.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
            Stay updated with our latest innovations, product launches,
            engineering breakthroughs, company news and research.
          </p>
        </div>

        {/* Carousel */}
        {loop.length > 0 && (
          <div className="relative">
            {/* Edge fades */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent md:w-40"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent md:w-40"
            />
            <div
              className="overflow-hidden"
              onMouseEnter={() => {
                pausedRef.current = true;
              }}
              onMouseLeave={() => {
                pausedRef.current = false;
              }}
            >
              <div
                ref={trackRef}
                className="flex gap-6 py-6 will-change-transform select-none"
                style={{
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "pan-y",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                {loop.map((p, i) => (
                  <InsightCard key={`${p.id}-${i}`} post={p} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function InsightCard({ post }: { post: Post }) {
  return (
    <Link
      to={`/blogs/${post.slug}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className="group relative flex w-[320px] shrink-0 flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_-14px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-20px_rgba(15,23,42,0.25)] sm:w-[340px] lg:w-[350px]"
    >
      {/* 16:10 image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {post.feature_image ? (
          <img
            src={post.feature_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.05]"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300" />
        )}
        <span
          className="absolute left-4 top-4 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-md"
          style={{
            borderColor: "rgba(255,255,255,0.4)",
            background: "rgba(15,20,30,0.42)",
          }}
        >
          {categoryLabel(post.content_type, post.tags)}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h4 className="line-clamp-2 text-[22px] font-bold leading-tight tracking-tight text-slate-900">
          {post.title}
        </h4>
        {post.excerpt && (
          <p className="line-clamp-2 text-[15px] leading-relaxed text-slate-600">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            {format(
              new Date(post.publish_date || post.created_at),
              "MMM d, yyyy",
            )}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-widest"
            style={{ color: ORANGE }}
          >
            Read
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>

      {/* Orange accent line */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-[3px] w-0 transition-all duration-500 ease-out group-hover:w-full"
        style={{ background: ORANGE }}
      />
    </Link>
  );
}

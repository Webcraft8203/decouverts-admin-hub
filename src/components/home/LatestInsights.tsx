import { useRef, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight, ArrowLeft, Calendar } from "lucide-react";
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

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, items.length]);

  const scrollByCards = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // one card + gap ≈ card width; approx by 80% of clientWidth for smoothness
    const first = el.querySelector<HTMLElement>("[data-insight-card]");
    const step = first ? first.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section
      id="latest-insights"
      className="relative overflow-hidden bg-white py-16 md:py-20"
    >
      {/* Soft orange radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,107,0,0.07) 0%, rgba(255,107,0,0) 70%)",
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-4xl px-6 text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]"
            style={{
              borderColor: "rgba(255,107,0,0.35)",
              color: ORANGE,
              background: "rgba(255,107,0,0.06)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: ORANGE }} />
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
        {items.length > 0 && (
          <div className="relative">
            {/* Edge fades */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent md:w-32"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent md:w-32"
            />

            {/* Prev button */}
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              disabled={!canPrev}
              aria-label="Previous"
              className="absolute left-3 md:left-6 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200 text-slate-800 transition-all hover:bg-[#FF6B00] hover:text-white hover:ring-[#FF6B00] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-800 disabled:hover:ring-slate-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Next button */}
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              disabled={!canNext}
              aria-label="Next"
              className="absolute right-3 md:right-6 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200 text-slate-800 transition-all hover:bg-[#FF6B00] hover:text-white hover:ring-[#FF6B00] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-800 disabled:hover:ring-slate-200"
            >
              <ArrowRight className="h-5 w-5" />
            </button>

            <div
              ref={scrollerRef}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-6 px-6 md:px-16 no-scrollbar"
              style={{ scrollbarWidth: "none" }}
            >
              {items.map((p) => (
                <div key={p.id} data-insight-card className="snap-start shrink-0">
                  <InsightCard post={p} />
                </div>
              ))}
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
      className="group relative flex w-[300px] sm:w-[340px] lg:w-[360px] shrink-0 flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_-14px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-20px_rgba(15,23,42,0.25)]"
    >
      {/* 16:10 image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {post.feature_image ? (
          <img
            src={post.feature_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.05]"
            loading="lazy"
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

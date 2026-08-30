import { useRef, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight, ArrowLeft, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      className="relative bg-white py-20 md:py-28 border-t border-border"
    >
      <div className="relative">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-4xl px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-primary" />
            <p className="text-primary font-semibold tracking-[0.2em] text-xs uppercase">Latest Insights</p>
            <span className="h-px w-10 bg-primary" />
          </div>
          <h2 className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-[52px]">
            Engineering Stories. Product Updates. Industry News.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
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
              className="absolute left-3 md:left-6 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-foreground disabled:hover:border-border"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Next button */}
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              disabled={!canNext}
              aria-label="Next"
              className="absolute right-3 md:right-6 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-foreground disabled:hover:border-border"
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
      className="group relative flex w-[300px] sm:w-[340px] lg:w-[360px] shrink-0 flex-col overflow-hidden rounded-lg bg-card border border-border transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40"
    >
      {/* 16:10 image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
        {post.feature_image ? (
          <img
            src={post.feature_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-secondary to-muted" />
        )}
        <span className="absolute left-4 top-4 inline-flex items-center rounded bg-[hsl(217,45%,9%)]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
          {categoryLabel(post.content_type, post.tags)}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h4 className="line-clamp-2 text-[22px] font-bold leading-tight tracking-tight text-foreground">
          {post.title}
        </h4>
        {post.excerpt && (
          <p className="line-clamp-2 text-[15px] leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {format(
              new Date(post.publish_date || post.created_at),
              "MMM d, yyyy",
            )}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-widest text-primary">
            Read
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>

      {/* Orange accent line */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-[3px] w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full"
      />
    </Link>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
  if (t.includes("update")) return "Update";
  return type === "news" ? "News" : "Blog";
};

export function LatestInsights() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["latest-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,feature_image,content_type,publish_date,created_at,tags")
        .eq("status", "published")
        .order("publish_date", { ascending: false })
        .limit(13);
      if (error) throw error;
      return (data || []) as Post[];
    },
  });

  const featured = posts?.[0];
  const rest = posts?.slice(1) || [];
  // Duplicate for seamless marquee loop
  const loop = [...rest, ...rest];

  return (
    <section
      id="latest-insights"
      className="relative overflow-hidden py-24 lg:py-32"
      style={{ background: "#F7F8FA" }}
    >
      {/* Engineering grid + orange radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at 50% 40%, black 40%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 40%, black 40%, transparent 85%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,107,0,0.14) 0%, rgba(255,107,0,0) 70%)",
        }}
      />
      {/* Subtle technical line */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-40 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(15,23,42,0.12) 50%, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]"
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
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-[56px] lg:leading-[1.05]">
            Engineering Stories.{" "}
            <span className="text-slate-500">Industry Updates.</span>{" "}
            <span style={{ color: ORANGE }}>Innovation.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Explore the latest product launches, engineering breakthroughs,
            research, company news and industry insights from Decouvertes.
          </p>
        </div>

        {/* Featured article */}
        {isLoading ? (
          <Skeleton className="mx-auto h-[480px] w-full max-w-[72%] rounded-[28px]" />
        ) : featured ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full lg:w-[72%]"
          >
            <Link
              to={`/blogs/${featured.slug}`}
              className="group relative block overflow-hidden rounded-[28px] bg-slate-900 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_40px_100px_-30px_rgba(255,107,0,0.35)]"
            >
              <div className="grid lg:grid-cols-[1.15fr_1fr]">
                <div className="relative h-[280px] overflow-hidden lg:h-[480px]">
                  {featured.feature_image ? (
                    <img
                      src={featured.feature_image}
                      alt={featured.title}
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-950/70" />
                  <span
                    className="absolute left-6 top-6 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur-md"
                    style={{
                      borderColor: "rgba(255,255,255,0.35)",
                      background: "rgba(255,255,255,0.12)",
                    }}
                  >
                    Featured · {categoryLabel(featured.content_type, featured.tags)}
                  </span>
                </div>
                <div className="flex flex-col justify-center gap-5 p-8 lg:p-12">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(
                      new Date(featured.publish_date || featured.created_at),
                      "MMMM d, yyyy",
                    )}
                  </div>
                  <h3 className="text-2xl font-semibold leading-tight text-white lg:text-3xl">
                    {featured.title}
                  </h3>
                  {featured.excerpt && (
                    <p className="line-clamp-3 text-base leading-relaxed text-white/70">
                      {featured.excerpt}
                    </p>
                  )}
                  <div
                    className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-semibold uppercase tracking-widest"
                    style={{ color: ORANGE }}
                  >
                    Read Article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ) : null}

        {/* Infinite marquee */}
        {rest.length > 0 && (
          <div className="relative mt-20">
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#F7F8FA] to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#F7F8FA] to-transparent"
            />
            <div className="marquee group overflow-hidden">
              <div className="marquee-track flex gap-6 py-4">
                {loop.map((p, i) => (
                  <InsightCard key={`${p.id}-${i}`} post={p} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 flex justify-center">
          <Button
            asChild
            size="lg"
            className="group h-12 rounded-full px-8 text-sm font-semibold uppercase tracking-widest text-white shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ background: ORANGE }}
          >
            <Link to="/blogs">
              View All Articles
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function InsightCard({ post }: { post: Post }) {
  return (
    <Link
      to={`/blogs/${post.slug}`}
      className="group relative flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_10px_30px_-15px_rgba(15,23,42,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(255,107,0,0.35)] sm:w-[340px] lg:w-[300px] xl:w-[320px]"
    >
      <div className="relative h-[200px] overflow-hidden bg-slate-100">
        {post.feature_image ? (
          <img
            src={post.feature_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.08]"
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
            background: "rgba(15,20,30,0.4)",
          }}
        >
          {categoryLabel(post.content_type, post.tags)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-slate-500">
          <Calendar className="h-3 w-3" />
          {format(
            new Date(post.publish_date || post.created_at),
            "MMM d, yyyy",
          )}
        </div>
        <h4 className="line-clamp-2 text-[17px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-slate-950">
          {post.title}
        </h4>
        {post.excerpt && (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
            {post.excerpt}
          </p>
        )}
        <div
          className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: ORANGE }}
        >
          Read More
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

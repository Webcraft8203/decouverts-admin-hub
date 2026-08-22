import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CustomerReview {
  id: string;
  customer_name: string;
  company_name: string;
  designation: string | null;
  photo_url: string | null;
  review_text: string;
  rating: number | null;
  image_title: string;
  image_description: string;
}

const AUTO_MS = 7000;

const renderStars = (rating: number | null) => {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn("h-4 w-4", star <= rating ? "text-primary fill-primary" : "text-border")}
        />
      ))}
    </div>
  );
};

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export const OurCustomers = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["published-customer-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_reviews")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as CustomerReview[];
    },
  });

  useEffect(() => {
    if (paused || prefersReducedMotion || !reviews || reviews.length <= 1) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % reviews.length), AUTO_MS);
    return () => clearTimeout(t);
  }, [active, paused, reviews, prefersReducedMotion]);

  useEffect(() => {
    if (reviews && active >= reviews.length) setActive(0);
  }, [reviews, active]);

  if (isLoading) {
    return (
      <section className="py-16 md:py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse h-8 bg-secondary rounded w-48 mx-auto mb-4" />
            <div className="animate-pulse h-4 bg-secondary rounded w-72 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (!reviews || reviews.length === 0) return null;

  const current = reviews[active] ?? reviews[0];
  const goPrev = () => setActive((i) => (i === 0 ? reviews.length - 1 : i - 1));
  const goNext = () => setActive((i) => (i === reviews.length - 1 ? 0 : i + 1));

  return (
    <section
      className="relative py-24 md:py-32 bg-background overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-14 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            What Our <span className="text-primary">Customers</span> Say
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trusted by engineers, institutions, and industry leaders worldwide
          </p>
        </motion.div>

        {/* Spotlight */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <button
              onClick={goPrev}
              aria-label="Previous testimonial"
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 lg:-translate-x-16 w-11 h-11 rounded-full border border-border bg-card items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              aria-label="Next testimonial"
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 lg:translate-x-16 w-11 h-11 rounded-full border border-border bg-card items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-2xl border border-border bg-card shadow-[0_20px_60px_-30px_rgba(15,23,42,0.15)] p-8 md:p-12 text-center"
              >
                <Quote className="w-10 h-10 text-primary/40 mx-auto mb-6" />
                <p className="text-xl md:text-2xl leading-relaxed text-foreground font-medium max-w-2xl mx-auto">
                  "{current.review_text}"
                </p>

                <div className="mt-8 flex justify-center">{renderStars(current.rating)}</div>

                <div className="mt-8 flex flex-col items-center gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/30">
                    <AvatarImage
                      src={current.photo_url || undefined}
                      alt={current.image_title}
                      title={current.image_description}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials(current.customer_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-foreground">{current.customer_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {current.designation && `${current.designation}, `}
                      {current.company_name}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Avatar rail */}
          {reviews.length > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              {reviews.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setActive(i)}
                  aria-label={`Show testimonial from ${r.customer_name}`}
                  className={cn(
                    "relative rounded-full transition-all duration-300",
                    i === active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-50 hover:opacity-80"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={r.photo_url || undefined} alt={r.image_title} />
                    <AvatarFallback className="bg-secondary text-muted-foreground text-xs font-semibold">
                      {initials(r.customer_name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

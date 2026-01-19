import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

export const OurCustomers = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

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

  if (isLoading) {
    return (
      <section className="py-20 md:py-28 section-dark relative">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse h-8 bg-dark-elevated rounded w-48 mx-auto mb-4" />
            <div className="animate-pulse h-4 bg-dark-elevated rounded w-72 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (!reviews || reviews.length === 0) return null;

  const itemsPerPage = isMobile ? 1 : isTablet ? 2 : 3;
  const totalPages = Math.ceil(reviews.length / itemsPerPage);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  const visibleReviews = reviews.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-primary fill-primary"
                : "text-dark-muted/30"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="py-20 md:py-28 section-dark relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-dark opacity-30" />
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 mb-4 text-xs font-bold tracking-[0.2em] uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            What Our <span className="text-primary">Customers</span> Say
          </h2>
          <p className="text-dark-muted text-lg max-w-2xl mx-auto">
            Trusted by engineers, institutions, and industry leaders worldwide
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {visibleReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-dark rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Quote Icon */}
                <div className="mb-6">
                  <Quote className="w-10 h-10 text-primary/30" />
                </div>

                {/* Review Text */}
                <p className="text-dark-muted leading-relaxed mb-6 line-clamp-4">
                  "{review.review_text}"
                </p>

                {/* Rating */}
                <div className="mb-6">
                  {renderStars(review.rating)}
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-4 pt-6 border-t border-dark-border">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage
                      src={review.photo_url || undefined}
                      alt={review.image_title}
                      title={review.image_description}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {review.customer_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-white">
                      {review.customer_name}
                    </h4>
                    <p className="text-sm text-dark-muted">
                      {review.designation && `${review.designation}, `}
                      {review.company_name}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Navigation */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="rounded-full border-dark-border bg-dark-elevated hover:bg-dark-accent hover:border-primary/30 text-dark-muted hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentPage ? "bg-primary w-6" : "bg-dark-border hover:bg-dark-muted"
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="rounded-full border-dark-border bg-dark-elevated hover:bg-dark-accent hover:border-primary/30 text-dark-muted hover:text-primary"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
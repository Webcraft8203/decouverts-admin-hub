import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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
      <section className="py-16 md:py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse h-8 bg-muted rounded w-48 mx-auto mb-4" />
            <div className="animate-pulse h-4 bg-muted rounded w-72 mx-auto" />
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
      <div className="flex gap-0.5 mt-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Blueprint grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Customers
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trusted by engineers, institutions, and industry leaders
          </p>
        </div>

        {/* Cards Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="bg-card rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 group"
              >
                {/* Customer Photo & Info */}
                <div className="flex items-center gap-4 mb-5">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/10">
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
                    <h3 className="font-semibold text-foreground">
                      {review.customer_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {review.designation && `${review.designation}, `}
                      {review.company_name}
                    </p>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                  "{review.review_text}"
                </p>

                {/* Rating */}
                {renderStars(review.rating)}
              </div>
            ))}
          </div>

          {/* Navigation */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentPage ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="rounded-full"
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

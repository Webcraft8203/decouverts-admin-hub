import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { NotificationMarquee } from "@/components/NotificationMarquee";
import { HomepageSection } from "@/components/home/HomepageSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HomepageGallery } from "@/components/home/HomepageGallery";
import { ContactSection } from "@/components/home/ContactSection";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
  const { data: sections, isLoading } = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const visibleSections = sections?.filter((s) => s.is_visible) || [];
  const visibleCount = visibleSections.length;

  // Determine grid layout based on visible sections
  const getGridClasses = () => {
    switch (visibleCount) {
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 1:
        return "grid-cols-1 max-w-2xl mx-auto";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <NotificationMarquee />

      <main className="flex-1 pt-24 md:pt-28">
        {isLoading ? (
          <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-72 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          </section>
        ) : visibleCount === 0 ? (
          <HeroSection />
        ) : (
          <section className="py-20 px-4 bg-gradient-to-br from-background via-background to-muted">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                  Welcome to <span className="text-primary">Decouverts Plus</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Discover our range of products and services tailored for excellence
                </p>
              </div>

              <div className={`grid ${getGridClasses()} gap-6`}>
                {visibleSections.map((section) => (
                  <HomepageSection
                    key={section.id}
                    sectionKey={section.section_key}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Homepage Gallery Section */}
        <HomepageGallery />

        {/* Features Section - Only show if sections are visible */}
        {visibleCount > 0 && (
          <section className="py-20 bg-muted/50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Why Choose <span className="text-primary">Decouverts Plus</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  We're committed to bringing you the best products and services with exceptional quality
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-card p-8 rounded-2xl border border-border text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">⭐</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Premium Quality</h3>
                  <p className="text-muted-foreground">
                    Curated selection of top-tier products and services
                  </p>
                </div>

                <div className="bg-card p-8 rounded-2xl border border-border text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🛡️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Secure & Reliable</h3>
                  <p className="text-muted-foreground">
                    Shop with confidence with our secure platform
                  </p>
                </div>

                <div className="bg-card p-8 rounded-2xl border border-border text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🚚</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Fast Delivery</h3>
                  <p className="text-muted-foreground">
                    Quick and reliable service to your doorstep
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <ContactSection />
      </main>

      <PublicFooter />
    </div>
  );
};

export default Home;

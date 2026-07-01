import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { NotificationMarquee } from "@/components/NotificationMarquee";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsCounter } from "@/components/home/StatsCounter";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { ProductCategories } from "@/components/home/ProductCategories";
import { HomepageGallery } from "@/components/home/HomepageGallery";
import { ContactSection } from "@/components/home/ContactSection";
import { OurCustomers } from "@/components/home/OurCustomers";
import { OurPartners } from "@/components/home/OurPartners";
import { BackToTop } from "@/components/home/BackToTop";
import { SectionDivider } from "@/components/home/SectionDivider";
import { OrganizationSchema } from "@/components/SEOSchemas";
import { usePageSEO } from "@/hooks/usePageSEO";

const Home = () => {
  usePageSEO({
    title: "Decouvertes | Indigenous Drone Technology Company India",
    description:
      "Decouvertes designs and manufactures next-generation drone systems in India. Configure custom UAVs, explore our fleet, and partner with an R&D-driven drone technology company.",
    path: "/",
  });
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const sectionId = location.state.scrollTo;
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const { data: hasNotification } = useQuery({
    queryKey: ["has-active-notification"],
    queryFn: async () => {
      const { data } = await supabase
        .from("homepage_notifications")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      return !!data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OrganizationSchema />
      <PublicNavbar />
      <NotificationMarquee />

      <main className={`flex-1 ${hasNotification ? "pt-24 md:pt-28" : "pt-16 md:pt-20"}`}>
        <HeroSection />

        {/* Cinematic fade from dark hero into light content */}
        <div className="h-20 md:h-24 bg-gradient-to-b from-slate-950 via-slate-900/40 to-white" />


        <StatsCounter />

        <FeaturedProducts />

        <ProductCategories />

        <SectionDivider variant="wave" from="fill-white" to="fill-slate-50" />

        <OurCustomers />

        <SectionDivider variant="curve" from="fill-slate-50" to="fill-[hsl(210,20%,98%)]" />

        <OurPartners />

        <HomepageGallery />

        <ContactSection />
      </main>

      <PublicFooter />
      <BackToTop />
    </div>
  );
};

export default Home;

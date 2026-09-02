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
import { LatestInsights } from "@/components/home/LatestInsights";
import { CertificationsSection } from "@/components/home/CertificationsSection";
import { HomepageGallery } from "@/components/home/HomepageGallery";
import { ContactSection } from "@/components/home/ContactSection";
import { OurCustomers } from "@/components/home/OurCustomers";
import { OurPartners } from "@/components/home/OurPartners";
import { CinematicSection } from "@/components/home/CinematicSection";

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

      <main className={`flex-1 ${hasNotification ? "pt-[120px] md:pt-[128px]" : "pt-[76px] md:pt-[84px]"}`}>
        <HeroSection />

        <CinematicSection variant="rise" tone="light">
          <StatsCounter />
        </CinematicSection>

        <CinematicSection variant="scale" tone="light">
          <ProductCategories />
        </CinematicSection>

        <CinematicSection variant="rise" delay={60} tone="light">
          <FeaturedProducts />
        </CinematicSection>

        <CinematicSection variant="scale" tone="dark">
          <HomepageGallery />
        </CinematicSection>

        <CinematicSection variant="rise" tone="light">
          <CertificationsSection />
        </CinematicSection>

        <CinematicSection variant="pan" tone="light">
          <OurCustomers />
        </CinematicSection>

        <CinematicSection variant="pan" tone="light">
          <OurPartners />
        </CinematicSection>

        <CinematicSection variant="rise" tone="light">
          <LatestInsights />
        </CinematicSection>

        <CinematicSection variant="rise" delay={80} tone="light">
          <ContactSection />
        </CinematicSection>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Home;

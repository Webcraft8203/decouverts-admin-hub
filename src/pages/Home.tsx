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
import { BackToTop } from "@/components/home/BackToTop";
import { CinematicSection, TacticalDivider } from "@/components/home/CinematicSection";

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

      <main className={`flex-1 ${hasNotification ? "pt-[132px] md:pt-[138px]" : "pt-[88px] md:pt-[90px]"}`}>
        {/* Hero stays untouched — defence-briefing rhythm wraps everything below */}
        <HeroSection />

        <TacticalDivider code="SEC · 01" label="MISSION TELEMETRY" status="LIVE FEED" tone="dark" />
        <CinematicSection variant="rise" hud grid scan grain tone="dark">
          <StatsCounter />
        </CinematicSection>

        <TacticalDivider code="SEC · 02" label="OPERATIONAL CAPABILITIES" status="CLASSIFIED" tone="dark" />
        <CinematicSection variant="scale" hud grid vignette scan tone="dark">
          <ProductCategories />
        </CinematicSection>

        <TacticalDivider code="SEC · 03" label="DEPLOYED PLATFORMS" status="IN SERVICE" tone="light" />
        <CinematicSection variant="rise" hud delay={60} tone="light">
          <FeaturedProducts />
        </CinematicSection>

        <TacticalDivider code="SEC · 04" label="TRUSTED OPERATORS" status="AUTHORISED" tone="light" />
        <CinematicSection variant="pan" tone="light">
          <OurCustomers />
        </CinematicSection>

        <TacticalDivider code="SEC · 05" label="COMPLIANCE MATRIX" status="CERTIFIED" tone="dark" />
        <CinematicSection variant="blur" hud grid grain vignette scan tone="dark">
          <CertificationsSection />
        </CinematicSection>

        <TacticalDivider code="SEC · 06" label="STRATEGIC PARTNERS" status="LINKED" tone="light" />
        <CinematicSection variant="pan" tone="light">
          <OurPartners />
        </CinematicSection>

        <TacticalDivider code="SEC · 07" label="INTEL BRIEFINGS" status="UPDATED" tone="light" />
        <CinematicSection variant="rise" tone="light">
          <LatestInsights />
        </CinematicSection>

        <TacticalDivider code="SEC · 08" label="FIELD IMAGERY" status="DECLASSIFIED" tone="dark" />
        <CinematicSection variant="scale" hud grid vignette grain scan tone="dark">
          <HomepageGallery />
        </CinematicSection>

        <TacticalDivider code="SEC · 09" label="SECURE CHANNEL" status="ENCRYPTED" tone="light" />
        <CinematicSection variant="rise" hud delay={80} tone="light">
          <ContactSection />
        </CinematicSection>
      </main>

      <PublicFooter />
      <BackToTop />
    </div>
  );
};

export default Home;

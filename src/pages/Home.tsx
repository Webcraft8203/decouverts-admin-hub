import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { NotificationMarquee } from "@/components/NotificationMarquee";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsCounter } from "@/components/home/StatsCounter";
import { WhatDrivesUs } from "@/components/home/WhatDrivesUs";
import { ServicesSection } from "@/components/home/ServicesSection";
import { IndustrySolutions } from "@/components/home/IndustrySolutions";
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
    title: "Decouvertes | Engineering, 3D Printing & Industrial Products India",
    description: "India's indigenous R&D technology company. Shop industrial 3D printers, drone systems, engineering services & premium products. Made in India.",
    path: "/",
  });
  const location = useLocation();

  // Handle scroll navigation from other pages
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

      <main className={`flex-1 ${hasNotification ? 'pt-24 md:pt-28' : 'pt-16 md:pt-20'}`}>
        {/* 1. Hero Section */}
        <HeroSection />
        
        {/* 2. Animated Stats Counter */}
        <StatsCounter />
        
        {/* Divider: light → dark */}
        <SectionDivider variant="wave" from="fill-[hsl(210,20%,98%)]" to="fill-[hsl(222,47%,11%)]" />
        
        {/* 3. What Drives Us */}
        <WhatDrivesUs />
        
        {/* Divider: dark → light */}
        <SectionDivider variant="curve" from="fill-[hsl(222,47%,11%)]" to="fill-[hsl(210,20%,98%)]" />
        
        {/* 4. Services Section */}
        <ServicesSection />
        
        {/* Divider: light → slate */}
        <SectionDivider variant="angle" from="fill-[hsl(210,20%,98%)]" to="fill-slate-50" />
        
        {/* 5. Industry Solutions */}
        <IndustrySolutions />
        
        {/* Divider: slate → dark */}
        <SectionDivider variant="wave" from="fill-slate-50" to="fill-[hsl(222,47%,11%)]" />
        
        {/* 6. Our Customers (Testimonials) */}
        <OurCustomers />
        
        {/* Divider: dark → light */}
        <SectionDivider variant="curve" from="fill-[hsl(222,47%,11%)]" to="fill-slate-50" />
        
        {/* 7. Our Partners */}
        <OurPartners />
        
        {/* 8. Homepage Gallery */}
        <HomepageGallery />
        
        {/* 9. Contact Us Section */}
        <ContactSection />
      </main>

      <PublicFooter />
      <BackToTop />
    </div>
  );
};

export default Home;

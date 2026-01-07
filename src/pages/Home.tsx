import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { NotificationMarquee } from "@/components/NotificationMarquee";
import { HeroSection } from "@/components/home/HeroSection";
import { WhatDrivesUs } from "@/components/home/WhatDrivesUs";
import { ServicesSection } from "@/components/home/ServicesSection";
import { IndustrySolutions } from "@/components/home/IndustrySolutions";
import { HomepageGallery } from "@/components/home/HomepageGallery";
import { ContactSection } from "@/components/home/ContactSection";
import { OurCustomers } from "@/components/home/OurCustomers";
import { OurPartners } from "@/components/home/OurPartners";

const Home = () => {
  // Check if there's an active notification to adjust spacing
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
      <PublicNavbar />
      <NotificationMarquee />

      <main className={`flex-1 ${hasNotification ? 'pt-24 md:pt-28' : 'pt-16 md:pt-20'}`}>
        {/* 1. Hero Section with integrated interactive hotspots */}
        <HeroSection />
        
        {/* 4. What Drives Us Slider */}
        <WhatDrivesUs />
        
        {/* 5. Services Section */}
        <ServicesSection />
        
        {/* 6. Industry Solutions */}
        <IndustrySolutions />
        
        {/* 7. Our Customers (Testimonials) */}
        <OurCustomers />
        
        {/* 8. Our Partners */}
        <OurPartners />
        
        {/* 9. Homepage Gallery (Admin-managed) */}
        <HomepageGallery />
        
        {/* 10. Contact Us Section */}
        <ContactSection />
      </main>

      <PublicFooter />
    </div>
  );
};

export default Home;

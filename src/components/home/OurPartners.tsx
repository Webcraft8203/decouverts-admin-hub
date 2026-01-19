import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface Partner {
  id: string;
  partner_name: string;
  logo_url: string;
  image_title: string;
  image_description: string;
  website_url: string | null;
}

export const OurPartners = () => {
  const { data: partners, isLoading } = useQuery({
    queryKey: ["published-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Partner[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse h-8 bg-muted rounded w-48 mx-auto mb-4" />
            <div className="animate-pulse h-4 bg-muted rounded w-72 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (!partners || partners.length === 0) return null;

  const PartnerCard = ({ partner }: { partner: Partner }) => {
    const content = (
      <div className="bg-card rounded-xl p-6 md:p-8 shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 group flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
        <img
          src={partner.logo_url}
          alt={partner.image_title}
          title={partner.image_title}
          className="max-h-12 md:max-h-16 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
        />
        
        <div className="absolute inset-0 bg-dark/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
          <h3 className="text-white font-semibold text-sm mb-1">
            {partner.image_title}
          </h3>
          <p className="text-dark-muted text-xs line-clamp-2">
            {partner.image_description}
          </p>
        </div>
      </div>
    );

    if (partner.website_url) {
      return (
        <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      );
    }
    return content;
  };

  return (
    <section className="py-20 md:py-28 bg-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-light opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 mb-4 text-xs font-bold tracking-[0.2em] uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
            Partnerships
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our <span className="text-primary">Partners</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Collaborating with leading technology and industrial partners
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <PartnerCard partner={partner} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
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
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-slate-100 hover:border-primary/20 group flex items-center justify-center h-[140px] md:h-[160px] relative overflow-hidden">
        <img
          src={partner.logo_url}
          alt={partner.image_title}
          title={partner.image_title}
          className="max-h-12 md:max-h-16 w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );

    if (partner.website_url) {
      return (
        <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="block h-full">
          {content}
        </a>
      );
    }
    return content;
  };

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 mb-4 text-xs font-bold tracking-[0.2em] uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
            Trusted Network
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Our <span className="text-primary">Partners</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Collaborating with industry leaders to deliver excellence.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
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
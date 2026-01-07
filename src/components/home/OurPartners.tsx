import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      <section className="py-16 md:py-24 bg-muted/30">
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
      <div className="bg-card rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 group flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
        {/* Logo with grayscale to color effect */}
        <img
          src={partner.logo_url}
          alt={partner.image_title}
          title={partner.image_title}
          className="max-h-16 md:max-h-20 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
        />
        
        {/* Hover overlay with title and description */}
        <div className="absolute inset-0 bg-foreground/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
          <h3 className="text-background font-semibold text-sm md:text-base mb-1">
            {partner.image_title}
          </h3>
          <p className="text-background/80 text-xs md:text-sm line-clamp-2">
            {partner.image_description}
          </p>
        </div>
      </div>
    );

    if (partner.website_url) {
      return (
        <a
          href={partner.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      );
    }

    return content;
  };

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Partners
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Collaborating with leading technology and industrial partners
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  );
};

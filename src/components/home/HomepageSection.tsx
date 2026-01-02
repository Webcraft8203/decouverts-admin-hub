import { useNavigate } from "react-router-dom";
import { ShoppingBag, Cog, Factory } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface HomepageSectionProps {
  sectionKey: string;
  className?: string;
}

const sectionConfig = {
  ecommerce: {
    title: "E-Commerce",
    subtitle: "Shop Premium Products",
    description: "Discover our curated collection of high-quality products",
    icon: ShoppingBag,
    route: "/shop",
    gradient: "from-primary/20 to-primary/5",
  },
  engineering: {
    title: "Engineering Services",
    subtitle: "Mechanical Engineering NPD",
    description: "New Product Development & Engineering Solutions",
    icon: Cog,
    route: "/engineering",
    gradient: "from-accent/20 to-accent/5",
  },
  manufacturing: {
    title: "Manufacturing",
    subtitle: "Industrial Solutions",
    description: "Custom Industrial Printers & Drones",
    icon: Factory,
    route: "/manufacturing",
    gradient: "from-secondary/20 to-secondary/5",
  },
};

export const HomepageSection = ({ sectionKey, className }: HomepageSectionProps) => {
  const navigate = useNavigate();
  const config = sectionConfig[sectionKey as keyof typeof sectionConfig];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <Card
      className={`group cursor-pointer overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 ${className}`}
      onClick={() => navigate(config.route)}
    >
      <CardContent className={`p-8 bg-gradient-to-br ${config.gradient} h-full flex flex-col items-center justify-center text-center min-h-[280px]`}>
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">{config.title}</h3>
        <p className="text-primary font-medium mb-2">{config.subtitle}</p>
        <p className="text-muted-foreground text-sm">{config.description}</p>
      </CardContent>
    </Card>
  );
};

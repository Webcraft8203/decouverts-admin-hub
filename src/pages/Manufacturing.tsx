import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Factory, Printer, Plane, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const manufacturingItems = [
  {
    title: "Decouverts DFT Series",
    description: "Configure your custom industrial 3D printer with our comprehensive configurator",
    icon: Printer,
    link: "/printer-configuration",
    available: true,
  },
  {
    title: "Industrial Custom Drones",
    description: "Advanced drone technology for industrial applications and inspections",
    icon: Plane,
    link: null,
    available: false,
  },
];

const Manufacturing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 bg-gradient-to-br from-background via-background to-muted pt-20">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
              <Factory className="w-12 h-12 text-primary" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Manufacturing
            </h1>

            <p className="text-xl text-primary font-medium mb-6">
              Industrial Solutions
            </p>

            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-6 py-3 rounded-full mb-8">
              <span className="text-2xl">🚧</span>
              <span className="text-lg font-semibold">Coming Soon</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {manufacturingItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card 
                  key={item.title} 
                  className={cn(
                    "border-border transition-all",
                    item.available 
                      ? "hover:border-primary/50 hover:shadow-lg cursor-pointer" 
                      : "opacity-70"
                  )}
                  onClick={() => item.link && navigate(item.link)}
                >
                  <CardContent className="p-8 text-center">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
                      item.available ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn("w-8 h-8", item.available ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {item.description}
                    </p>
                    {item.available ? (
                      <Button onClick={() => item.link && navigate(item.link)} className="gap-2">
                        Configure Now
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        🚧 Coming Soon
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              We're preparing cutting-edge manufacturing solutions for you.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Manufacturing;

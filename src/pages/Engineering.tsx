import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Cog, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Engineering = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted pt-20">
        <div className="max-w-2xl mx-auto px-4 text-center py-20">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <Cog className="w-12 h-12 text-primary" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Engineering Services
          </h1>

          <p className="text-xl text-primary font-medium mb-6">
            Mechanical Engineering NPD
          </p>

          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-6 py-3 rounded-full mb-8">
            <span className="text-2xl">🚧</span>
            <span className="text-lg font-semibold">Coming Soon</span>
          </div>

          <p className="text-muted-foreground mb-8">
            We're working hard to bring you innovative engineering solutions. 
            Stay tuned for our New Product Development services.
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
      </main>

      <PublicFooter />
    </div>
  );
};

export default Engineering;

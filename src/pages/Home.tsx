import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { ShoppingBag, Star, Shield, Truck } from "lucide-react";
import logo from "@/assets/logo.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      
      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-background via-background to-muted pt-20">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--accent))_1px,transparent_0)] bg-[size:40px_40px]" />
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* Text Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
                  <Star className="w-4 h-4 fill-primary" />
                  <span className="text-sm font-medium">Premium Quality Products</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-slide-up">
                  Welcome to{" "}
                  <span className="text-primary">Decouverts Plus</span>
                </h1>
                
                <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                  Discover excellence in every product. Your destination for premium quality items at exceptional value.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: "0.2s" }}>
                  <Button 
                    size="lg"
                    onClick={() => navigate("/shop")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg px-8 py-6 shadow-lg shadow-primary/25"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Shop Now
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/shop")}
                    className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-semibold text-lg px-8 py-6"
                  >
                    Browse Products
                  </Button>
                </div>
              </div>

              {/* Logo/Visual */}
              <div className="flex-1 flex justify-center lg:justify-end animate-scale-in">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                  <div className="relative bg-gradient-to-br from-primary/10 to-transparent p-8 rounded-3xl border border-primary/20">
                    <img 
                      src={logo} 
                      alt="Decouverts Plus" 
                      className="w-48 sm:w-64 lg:w-80 h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Why Choose <span className="text-primary">Decouverts Plus</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We're committed to bringing you the best products with exceptional service.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-2xl border border-border hover:border-primary/30 transition-colors text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Premium Quality</h3>
                <p className="text-muted-foreground">
                  Curated selection of top-tier products that meet the highest standards.
                </p>
              </div>

              <div className="bg-card p-8 rounded-2xl border border-border hover:border-primary/30 transition-colors text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Secure Shopping</h3>
                <p className="text-muted-foreground">
                  Shop with confidence with our secure payment processing and data protection.
                </p>
              </div>

              <div className="bg-card p-8 rounded-2xl border border-border hover:border-primary/30 transition-colors text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Truck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Fast Delivery</h3>
                <p className="text-muted-foreground">
                  Quick and reliable shipping to get your products to you on time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-20 bg-accent text-accent-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-6">
              <span className="text-sm font-medium">Coming Soon</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Exciting Products <span className="text-primary">On The Way</span>
            </h2>
            <p className="text-accent-foreground/70 text-lg max-w-2xl mx-auto mb-8">
              We're preparing an amazing collection of premium products just for you. 
              Stay tuned for our official launch!
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/shop")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg px-8"
            >
              Preview Shop
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Home;

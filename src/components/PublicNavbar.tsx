import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

export const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount >= 10) {
      setLogoClickCount(0);
      navigate("/auth");
    } else {
      setTimeout(() => setLogoClickCount(0), 2000);
    }
  };

  const { data: cartCount = 0 } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id);
      if (error) throw error;
      return data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    },
    enabled: !!user,
  });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img 
              src={logo} 
              alt="Decouverts Plus" 
              className="h-12 md:h-14 lg:h-16 w-auto"
            />
            <div className="flex flex-col items-start">
              <span className="text-lg md:text-xl lg:text-4xl font-extrabold tracking-widest lg:tracking-[0.2em] uppercase text-foreground leading-none">
                DECOUVERTS
              </span>
              <span className="text-[10px] lg:text-sm font-medium tracking-wider text-blue-600 mt-0.5 lg:mt-1">
                Discovering Future Technologies
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-foreground/70 hover:text-primary transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="text-foreground/70 hover:text-primary transition-colors font-medium"
            >
              About Us
            </Link>
            <Link 
              to="/shop" 
              className="text-foreground/70 hover:text-primary transition-colors font-medium"
            >
              Shop
            </Link>
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/dashboard/cart")}
                  className="relative text-foreground/70 hover:text-primary"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Button>
                <Button 
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                >
                  <User className="w-4 h-4 mr-2" />
                  My Account
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="text-foreground/70 hover:text-primary"
              >
                <User className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/dashboard/cart")}
                className="relative text-foreground/70 hover:text-primary"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Button>
            )}
            <button
              className="p-2 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in bg-white">
            <div className="flex flex-col gap-4">
              <Link 
                to="/" 
                className="text-foreground/70 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/about" 
                className="text-foreground/70 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                to="/shop" 
                className="text-foreground/70 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop
              </Link>
              {user ? (
                <Button 
                  onClick={() => {
                    navigate("/dashboard");
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
                >
                  <User className="w-4 h-4 mr-2" />
                  My Account
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    navigate("/login");
                    setIsMenuOpen(false);
                  }}
                  className="w-full"
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

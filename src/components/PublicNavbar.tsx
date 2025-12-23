import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

export const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch cart items count
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Decouverts Plus" 
              className="h-10 md:h-12 w-auto"
            />
            <span className="text-lg md:text-xl font-bold text-foreground hidden sm:block">
              Decouverts Plus
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              to="/shop" 
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Shop
            </Link>
            <Button 
              onClick={() => navigate("/shop")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop Now
            </Button>
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/dashboard/cart")}
                  className="relative text-foreground/80 hover:text-foreground"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/dashboard")}
                  className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <User className="w-4 h-4 mr-2" />
                  My Account
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="text-foreground/80 hover:text-foreground"
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
                className="relative text-foreground/80 hover:text-foreground"
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
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link 
                to="/" 
                className="text-foreground/80 hover:text-foreground transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/shop" 
                className="text-foreground/80 hover:text-foreground transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop
              </Link>
              <Button 
                onClick={() => {
                  navigate("/shop");
                  setIsMenuOpen(false);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold w-full"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Shop Now
              </Button>
              {user ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigate("/dashboard");
                    setIsMenuOpen(false);
                  }}
                  className="w-full"
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
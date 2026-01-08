import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if e-commerce is enabled
  const { data: isEcommerceEnabled = true } = useQuery({
    queryKey: ["ecommerce-visibility"],
    queryFn: async () => {
      const { data } = await supabase
        .from("homepage_sections")
        .select("is_visible")
        .eq("section_key", "ecommerce")
        .maybeSingle();
      return data?.is_visible ?? true;
    },
  });

  // Determine if we're on a shop-related page
  const isShopPage = location.pathname.startsWith("/shop") || 
                     location.pathname.startsWith("/product") || 
                     location.pathname.startsWith("/checkout") ||
                     location.pathname.startsWith("/dashboard");

  // Show cart/account only on shop-related pages when e-commerce is enabled
  const showCartAndAccount = isEcommerceEnabled && isShopPage;

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
    enabled: !!user && isEcommerceEnabled,
  });

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

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
              className="h-12 md:h-14 lg:h-14 w-auto"
            />
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-lg lg:text-2xl font-extrabold tracking-widest lg:tracking-[0.2em] uppercase text-foreground leading-none">
                DECOUVERTS
              </span>
              <span className="text-[8px] lg:text-xs font-medium tracking-wider text-blue-600 mt-0.5">
                Discovering Future Technologies
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link 
              to="/" 
              className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm lg:text-base"
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm lg:text-base"
            >
              About
            </Link>
            
            {/* Services Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-foreground/70 hover:text-primary transition-colors font-medium text-sm lg:text-base outline-none">
                Services <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white">
                <DropdownMenuItem onClick={() => navigate("/manufacturing")}>
                  Manufacturing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/engineering")}>
                  Engineering
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => scrollToSection("services-section")}>
                  All Services
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Solutions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-foreground/70 hover:text-primary transition-colors font-medium text-sm lg:text-base outline-none">
                Solutions <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white">
                <DropdownMenuItem onClick={() => scrollToSection("industry-solutions")}>
                  Industry Solutions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/printer-configuration")}>
                  3D Printer Configuration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/drone-configuration")}>
                  Drone Configuration
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button 
              onClick={() => scrollToSection("gallery-section")}
              className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm lg:text-base"
            >
              Gallery
            </button>

            <button 
              onClick={() => scrollToSection("contact-section")}
              className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm lg:text-base"
            >
              Contact
            </button>

            {/* Shop - only show if e-commerce is enabled */}
            {isEcommerceEnabled && (
              <Link 
                to="/shop" 
                className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm lg:text-base"
              >
                Shop
              </Link>
            )}

            {/* Cart and Account - only show on shop pages when e-commerce is enabled */}
            {showCartAndAccount && (
              <>
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
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {showCartAndAccount && user && (
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
            <div className="flex flex-col gap-3">
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
              
              {/* Services */}
              <div className="py-2">
                <p className="text-foreground font-semibold mb-2">Services</p>
                <div className="pl-4 flex flex-col gap-2">
                  <Link 
                    to="/manufacturing" 
                    className="text-foreground/70 hover:text-primary transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Manufacturing
                  </Link>
                  <Link 
                    to="/engineering" 
                    className="text-foreground/70 hover:text-primary transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Engineering
                  </Link>
                  <button 
                    onClick={() => scrollToSection("services-section")}
                    className="text-foreground/70 hover:text-primary transition-colors text-sm text-left"
                  >
                    All Services
                  </button>
                </div>
              </div>

              {/* Solutions */}
              <div className="py-2">
                <p className="text-foreground font-semibold mb-2">Solutions</p>
                <div className="pl-4 flex flex-col gap-2">
                  <button 
                    onClick={() => scrollToSection("industry-solutions")}
                    className="text-foreground/70 hover:text-primary transition-colors text-sm text-left"
                  >
                    Industry Solutions
                  </button>
                  <Link 
                    to="/printer-configuration" 
                    className="text-foreground/70 hover:text-primary transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    3D Printer Configuration
                  </Link>
                  <Link 
                    to="/drone-configuration" 
                    className="text-foreground/70 hover:text-primary transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Drone Configuration
                  </Link>
                </div>
              </div>

              <button 
                onClick={() => scrollToSection("gallery-section")}
                className="text-foreground/70 hover:text-primary transition-colors font-medium py-2 text-left"
              >
                Gallery
              </button>

              <button 
                onClick={() => scrollToSection("contact-section")}
                className="text-foreground/70 hover:text-primary transition-colors font-medium py-2 text-left"
              >
                Contact Us
              </button>

              {/* Shop - only show if e-commerce is enabled */}
              {isEcommerceEnabled && (
                <Link 
                  to="/shop" 
                  className="text-foreground/70 hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </Link>
              )}

              {/* Account - only show on shop pages when e-commerce is enabled */}
              {showCartAndAccount && (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
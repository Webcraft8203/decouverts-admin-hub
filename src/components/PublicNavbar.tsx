import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";

export const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const NavItem = ({ children, className, ...props }: React.ComponentProps<typeof Link>) => (
    <Link 
      className={cn(
        "relative text-sm font-medium transition-colors hover:text-primary",
        "after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );

  const NavButton = ({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) => (
    <button 
      onClick={onClick}
      className={cn(
        "relative text-sm font-medium transition-colors hover:text-primary",
        "after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full",
        className
      )}
    >
      {children}
    </button>
  );

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-white/95 backdrop-blur-xl border-b border-border shadow-soft" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <img 
              src={logo} 
              alt="Decouverts Plus" 
              className="h-9 md:h-11 lg:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col justify-center">
              <span 
                className={cn(
                  "text-base md:text-lg lg:text-xl font-bold tracking-[0.15em] uppercase leading-none transition-colors",
                  isScrolled ? "text-foreground" : "text-foreground"
                )}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                DECOUVERTS
              </span>
              <span 
                className={cn(
                  "text-[8px] md:text-[9px] lg:text-[10px] font-medium tracking-wider leading-tight mt-0.5 transition-colors",
                  isScrolled ? "text-primary" : "text-primary"
                )}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Discovering Future Technologies
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <NavItem 
              to="/" 
              className={isScrolled ? "text-foreground/80" : "text-foreground/80"}
            >
              Home
            </NavItem>

            <NavItem 
              to="/blogs" 
              className={isScrolled ? "text-foreground/80" : "text-foreground/80"}
            >
              Blogs
            </NavItem>

            {/* Show full navigation only when NOT on shop pages */}
            {!isShopPage && (
              <>
                <NavItem 
                  to="/about" 
                  className={isScrolled ? "text-foreground/80" : "text-foreground/80"}
                >
                  About
                </NavItem>
                
                {/* Services Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(
                    "flex items-center gap-1 text-sm font-medium transition-colors outline-none hover:text-primary",
                    isScrolled ? "text-foreground/80" : "text-foreground/80"
                  )}>
                    Services <ChevronDown className="w-3.5 h-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-white/95 backdrop-blur-xl border-border/50 shadow-lg">
                    <DropdownMenuItem onClick={() => navigate("/manufacturing")} className="cursor-pointer">
                      Manufacturing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/engineering")} className="cursor-pointer">
                      Engineering
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => scrollToSection("services-section")} className="cursor-pointer">
                      All Services
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Solutions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(
                    "flex items-center gap-1 text-sm font-medium transition-colors outline-none hover:text-primary",
                    isScrolled ? "text-foreground/80" : "text-foreground/80"
                  )}>
                    Solutions <ChevronDown className="w-3.5 h-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-white/95 backdrop-blur-xl border-border/50 shadow-lg">
                    <DropdownMenuItem onClick={() => scrollToSection("industry-solutions")} className="cursor-pointer">
                      Industry Solutions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/printer-configuration")} className="cursor-pointer">
                      3D Printer Configuration
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/drone-configuration")} className="cursor-pointer">
                      Drone Configuration
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <NavButton 
                  onClick={() => scrollToSection("gallery-section")}
                  className={isScrolled ? "text-foreground/80" : "text-foreground/80"}
                >
                  Gallery
                </NavButton>

                <NavButton 
                  onClick={() => scrollToSection("contact-section")}
                  className={isScrolled ? "text-foreground/80" : "text-foreground/80"}
                >
                  Contact
                </NavButton>
              </>
            )}

            {/* Shop - only show if e-commerce is enabled */}
            {isEcommerceEnabled && (
              <NavItem 
                to="/shop" 
                className={isScrolled ? "text-foreground/80" : "text-foreground/80"}
              >
                Shop
              </NavItem>
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
                      className="relative text-foreground/80 hover:text-primary hover:bg-primary/5"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-glow">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </Button>
                    <Button 
                      onClick={() => navigate("/dashboard")}
                      className="bg-dark hover:bg-dark-elevated text-white shadow-lg"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Account
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => navigate("/login")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
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
                className="relative text-foreground/80 hover:text-primary"
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
              className="p-2 text-foreground rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-border animate-fade-in bg-white/95 backdrop-blur-xl rounded-b-2xl shadow-lg">
            <div className="flex flex-col gap-1">
              <Link 
                to="/" 
                className="text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors font-medium py-3 px-4 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/blogs" 
                className="text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors font-medium py-3 px-4 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Blogs & News
              </Link>

              {/* Show full navigation only when NOT on shop pages */}
              {!isShopPage && (
                <>
                  <Link 
                    to="/about" 
                    className="text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors font-medium py-3 px-4 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About Us
                  </Link>
                  
                  {/* Services */}
                  <div className="py-2 px-4">
                    <p className="text-foreground font-semibold mb-2 text-sm uppercase tracking-wider">Services</p>
                    <div className="pl-3 flex flex-col gap-1 border-l-2 border-primary/20">
                      <Link 
                        to="/manufacturing" 
                        className="text-foreground/70 hover:text-primary transition-colors text-sm py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Manufacturing
                      </Link>
                      <Link 
                        to="/engineering" 
                        className="text-foreground/70 hover:text-primary transition-colors text-sm py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Engineering
                      </Link>
                      <button 
                        onClick={() => scrollToSection("services-section")}
                        className="text-foreground/70 hover:text-primary transition-colors text-sm text-left py-2"
                      >
                        All Services
                      </button>
                    </div>
                  </div>

                  {/* Solutions */}
                  <div className="py-2 px-4">
                    <p className="text-foreground font-semibold mb-2 text-sm uppercase tracking-wider">Solutions</p>
                    <div className="pl-3 flex flex-col gap-1 border-l-2 border-primary/20">
                      <button 
                        onClick={() => scrollToSection("industry-solutions")}
                        className="text-foreground/70 hover:text-primary transition-colors text-sm text-left py-2"
                      >
                        Industry Solutions
                      </button>
                      <Link 
                        to="/printer-configuration" 
                        className="text-foreground/70 hover:text-primary transition-colors text-sm py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        3D Printer Configuration
                      </Link>
                      <Link 
                        to="/drone-configuration" 
                        className="text-foreground/70 hover:text-primary transition-colors text-sm py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Drone Configuration
                      </Link>
                    </div>
                  </div>

                  <button 
                    onClick={() => scrollToSection("gallery-section")}
                    className="text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors font-medium py-3 px-4 rounded-lg text-left"
                  >
                    Gallery
                  </button>

                  <button 
                    onClick={() => scrollToSection("contact-section")}
                    className="text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors font-medium py-3 px-4 rounded-lg text-left"
                  >
                    Contact Us
                  </button>
                </>
              )}

              {/* Shop - only show if e-commerce is enabled */}
              {isEcommerceEnabled && (
                <Link 
                  to="/shop" 
                  className="text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors font-medium py-3 px-4 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </Link>
              )}

              {/* Account - only show on shop pages when e-commerce is enabled */}
              {showCartAndAccount && (
                <div className="pt-4 px-4">
                  {user ? (
                    <Button 
                      onClick={() => {
                        navigate("/dashboard");
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-dark hover:bg-dark-elevated text-white"
                    >
                      <User className="w-4 h-4 mr-2" />
                      My Account
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {
                        navigate("/login");
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
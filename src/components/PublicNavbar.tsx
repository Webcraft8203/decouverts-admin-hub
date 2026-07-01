import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const isShopPage =
    location.pathname.startsWith("/shop") ||
    location.pathname.startsWith("/product") ||
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/dashboard");

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

  const NavItem = ({ children, className, to, ...props }: React.ComponentProps<typeof Link>) => {
    const active = typeof to === "string" && location.pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          "relative text-[13px] font-semibold tracking-wide transition-colors py-1.5",
          active ? "text-primary" : "text-slate-700 hover:text-primary",
          "after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-primary after:transition-all after:duration-300 after:ease-out",
          active ? "after:w-full" : "after:w-0 hover:after:w-full",
          className
        )}
        {...props}
      >
        {children}
      </Link>
    );
  };

  const NavButton = ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
  }) => (
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        isScrolled
          ? "top-3 w-[min(1240px,calc(100%-1.5rem))] rounded-2xl bg-white/85 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)] border border-slate-200/70"
          : "top-0 w-full bg-white border-b border-slate-200/70"
      )}
    >
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", isScrolled ? "max-w-none" : "max-w-7xl")}>
        <div className="flex items-center justify-between h-[68px] md:h-[76px]">
          {/* Logo */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <img
              src={logo}
              alt="Decouvertes Logo"
              className="h-9 md:h-11 lg:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col justify-center">
              <span
                className="text-base md:text-lg lg:text-xl font-bold tracking-[0.15em] uppercase leading-none text-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                DECOUVERTES
              </span>
              <span
                className="text-[8px] md:text-[9px] lg:text-[10px] font-medium tracking-wider leading-tight mt-0.5 text-primary"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Drone Technology
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <NavItem to="/" className="text-foreground/80">Home</NavItem>

            {!isShopPage && (
              <>
                <NavButton onClick={() => scrollToSection("gallery-section")} className="text-foreground/80">
                  Gallery
                </NavButton>
                <NavItem to="/blogs" className="text-foreground/80">Blogs</NavItem>
                <NavItem to="/about" className="text-foreground/80">About</NavItem>
                <NavButton onClick={() => scrollToSection("contact-section")} className="text-foreground/80">
                  Contact
                </NavButton>
              </>
            )}

            {isEcommerceEnabled && (
              <NavItem to="/shop" className="text-foreground/80">Shop</NavItem>
            )}

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
          <div className="md:hidden border-t border-border bg-white/95 backdrop-blur-xl rounded-b-2xl shadow-lg overflow-hidden">
            <div className="py-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="flex flex-col gap-1 px-2">
                <Link
                  to="/"
                  className="block text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-300 hover:translate-x-2 font-medium py-3 px-4 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>

                {!isShopPage && (
                  <>
                    <button
                      onClick={() => scrollToSection("gallery-section")}
                      className="block w-full text-left text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-300 hover:translate-x-2 font-medium py-3 px-4 rounded-lg"
                    >
                      Gallery
                    </button>
                    <Link
                      to="/blogs"
                      className="block text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-300 hover:translate-x-2 font-medium py-3 px-4 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Blogs
                    </Link>
                    <Link
                      to="/about"
                      className="block text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-300 hover:translate-x-2 font-medium py-3 px-4 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      About
                    </Link>
                    <button
                      onClick={() => scrollToSection("contact-section")}
                      className="block w-full text-left text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-300 hover:translate-x-2 font-medium py-3 px-4 rounded-lg"
                    >
                      Contact
                    </button>
                  </>
                )}

                {isEcommerceEnabled && (
                  <Link
                    to="/shop"
                    className="block text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-300 hover:translate-x-2 font-medium py-3 px-4 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Shop
                  </Link>
                )}

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
          </div>
        )}
      </div>
    </nav>
  );
};

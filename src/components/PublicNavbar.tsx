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
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 w-full z-50",
        "h-[88px] md:h-[90px]",
        "transition-[background-color,box-shadow,backdrop-filter] duration-[250ms] ease-out",
        isScrolled
          ? "bg-white/[0.97] shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-[6px]"
          : "bg-white"
      )}
    >
      <div className="mx-auto h-full max-w-[1440px] px-6 md:px-10 lg:px-20 flex items-center justify-between relative">
        {/* Left — Logo + Brand */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none group flex-shrink-0"
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

        {/* Center — Navigation */}
        <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          <Link
            to="/"
            className={cn(
              "relative text-[13px] font-semibold tracking-wide transition-colors duration-200 py-1",
              "after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:bg-primary after:transition-all after:duration-300 after:ease-out",
              isActive("/")
                ? "text-primary after:w-full"
                : "text-slate-700 hover:text-primary after:w-0 hover:after:w-full"
            )}
          >
            Home
          </Link>

          {!isShopPage && (
            <>
              <button
                onClick={() => scrollToSection("gallery-section")}
                className={cn(
                  "relative text-[13px] font-semibold tracking-wide transition-colors duration-200 py-1",
                  "after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:bg-primary after:transition-all after:duration-300 after:ease-out after:w-0 hover:after:w-full",
                  "text-slate-700 hover:text-primary"
                )}
              >
                Gallery
              </button>
              <Link
                to="/blogs"
                className={cn(
                  "relative text-[13px] font-semibold tracking-wide transition-colors duration-200 py-1",
                  "after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:bg-primary after:transition-all after:duration-300 after:ease-out",
                  isActive("/blogs")
                    ? "text-primary after:w-full"
                    : "text-slate-700 hover:text-primary after:w-0 hover:after:w-full"
                )}
              >
                Blogs
              </Link>
              <Link
                to="/about"
                className={cn(
                  "relative text-[13px] font-semibold tracking-wide transition-colors duration-200 py-1",
                  "after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:bg-primary after:transition-all after:duration-300 after:ease-out",
                  isActive("/about")
                    ? "text-primary after:w-full"
                    : "text-slate-700 hover:text-primary after:w-0 hover:after:w-full"
                )}
              >
                About
              </Link>
              <button
                onClick={() => scrollToSection("contact-section")}
                className={cn(
                  "relative text-[13px] font-semibold tracking-wide transition-colors duration-200 py-1",
                  "after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:bg-primary after:transition-all after:duration-300 after:ease-out after:w-0 hover:after:w-full",
                  "text-slate-700 hover:text-primary"
                )}
              >
                Contact
              </button>
            </>
          )}

          {isEcommerceEnabled && (
            <Link
              to="/shop"
              className={cn(
                "relative text-[13px] font-semibold tracking-wide transition-colors duration-200 py-1",
                "after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:bg-primary after:transition-all after:duration-300 after:ease-out",
                isActive("/shop")
                  ? "text-primary after:w-full"
                  : "text-slate-700 hover:text-primary after:w-0 hover:after:w-full"
              )}
            >
              Shop
            </Link>
          )}
        </div>

        {/* Right — CTA / Account */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          {!isShopPage && (
            <button
              onClick={() => scrollToSection("contact-section")}
              className="inline-flex items-center justify-center h-11 px-[18px] rounded-[14px] bg-primary text-primary-foreground text-[13px] font-semibold tracking-wide shadow-[0_4px_14px_rgba(249,115,22,0.25)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.35)] hover:-translate-y-[1px] hover:bg-[hsl(24,95%,47%)] transition-all duration-200"
            >
              Get a Quote
            </button>
          )}

          {showCartAndAccount && (
            <>
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/dashboard/cart")}
                    className="relative text-slate-700 hover:text-primary hover:bg-primary/5"
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
                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-10 px-4 rounded-[14px]"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Account
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 px-4 rounded-[14px]"
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
              className="relative text-slate-700 hover:text-primary"
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
            className="p-2 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/98 backdrop-blur-[6px] border-t border-slate-100 shadow-lg overflow-hidden">
          <div className="py-6 max-h-[calc(100vh-5.5rem)] overflow-y-auto">
            <div className="flex flex-col gap-1 px-6">
              <Link
                to="/"
                className="block text-slate-700 hover:text-primary hover:bg-primary/5 transition-all duration-200 font-medium py-3 px-4 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              {!isShopPage && (
                <>
                  <button
                    onClick={() => scrollToSection("gallery-section")}
                    className="block w-full text-left text-slate-700 hover:text-primary hover:bg-primary/5 transition-all duration-200 font-medium py-3 px-4 rounded-lg"
                  >
                    Gallery
                  </button>
                  <Link
                    to="/blogs"
                    className="block text-slate-700 hover:text-primary hover:bg-primary/5 transition-all duration-200 font-medium py-3 px-4 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Blogs
                  </Link>
                  <Link
                    to="/about"
                    className="block text-slate-700 hover:text-primary hover:bg-primary/5 transition-all duration-200 font-medium py-3 px-4 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About
                  </Link>
                  <button
                    onClick={() => scrollToSection("contact-section")}
                    className="block w-full text-left text-slate-700 hover:text-primary hover:bg-primary/5 transition-all duration-200 font-medium py-3 px-4 rounded-lg"
                  >
                    Contact
                  </button>
                </>
              )}

              {isEcommerceEnabled && (
                <Link
                  to="/shop"
                  className="block text-slate-700 hover:text-primary hover:bg-primary/5 transition-all duration-200 font-medium py-3 px-4 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </Link>
              )}

              {!isShopPage && (
                <div className="pt-4 px-4">
                  <button
                    onClick={() => scrollToSection("contact-section")}
                    className="w-full inline-flex items-center justify-center h-11 px-[18px] rounded-[14px] bg-primary text-primary-foreground text-[13px] font-semibold tracking-wide shadow-[0_4px_14px_rgba(249,115,22,0.25)]"
                  >
                    Get a Quote
                  </button>
                </div>
              )}

              {showCartAndAccount && (
                <div className="pt-4 px-4">
                  {user ? (
                    <Button
                      onClick={() => {
                        navigate("/dashboard");
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 rounded-[14px]"
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
                      className="w-full bg-primary hover:bg-primary/90 h-11 rounded-[14px]"
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
    </nav>
  );
};

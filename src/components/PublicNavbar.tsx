import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

/**
 * Hidden admin-access gesture: 10 logo clicks within a rolling idle window
 * opens the existing admin auth flow. Kept as module-level state (not React
 * state) so the count survives the navbar remounting on every normal
 * page/route navigation — a single click always behaves like a standard
 * logo link to "/".
 */
const ADMIN_CLICK_THRESHOLD = 10;
const ADMIN_CLICK_RESET_MS = 3000;
let adminClickCount = 0;
let adminClickResetTimer: ReturnType<typeof setTimeout> | null = null;

export const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    adminClickCount += 1;
    if (adminClickResetTimer) clearTimeout(adminClickResetTimer);

    if (adminClickCount >= ADMIN_CLICK_THRESHOLD) {
      adminClickCount = 0;
      e.preventDefault();
      navigate("/auth");
      return;
    }

    adminClickResetTimer = setTimeout(() => {
      adminClickCount = 0;
    }, ADMIN_CLICK_RESET_MS);
    // No preventDefault — a normal click just follows the Link to "/" as usual.
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

  const navLinkClass = (active: boolean) =>
    cn(
      "relative text-[13px] font-semibold tracking-wide transition-colors duration-200 py-1",
      "after:absolute after:left-0 after:bottom-[-2px] after:h-px after:bg-primary after:transition-all after:duration-200 after:ease-out",
      active
        ? "text-foreground after:w-full"
        : "text-foreground/70 hover:text-foreground after:w-0 hover:after:w-full"
    );

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 w-full z-50",
        "h-[76px] md:h-[84px]",
        "transition-[box-shadow,border-color] duration-300 ease-out",
        "border-b bg-white",
        isScrolled ? "border-border shadow-sm" : "border-transparent"
      )}
    >
      <div className="mx-auto h-full max-w-[1440px] px-6 md:px-10 lg:px-16 flex items-center justify-between relative">
        {/* Left — Logo + Brand */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center gap-4 select-none flex-shrink-0"
          aria-label="Decouvertes — go to homepage"
        >
          <img
            src={logo}
            alt="Decouvertes Logo"
            className="h-10 md:h-11 w-auto object-contain"
          />
          <div className="flex flex-col justify-center">
            <span className="font-brand text-lg md:text-xl tracking-[0.12em] uppercase leading-none font-bold text-foreground">
              DECOUVERTES
            </span>
            <span className="font-brand text-[10px] tracking-[0.08em] leading-tight mt-1.5 font-medium text-muted-foreground">
              Discovering Future Technologies
            </span>
          </div>
        </Link>

        {/* Center — Navigation */}
        <div className="hidden md:flex items-center gap-9 absolute left-1/2 -translate-x-1/2">
          <Link to="/" className={navLinkClass(isActive("/"))}>
            Home
          </Link>

          {!isShopPage && (
            <>
              <button onClick={() => scrollToSection("gallery-section")} className={navLinkClass(false)}>
                Gallery
              </button>
              <Link to="/blogs" className={navLinkClass(isActive("/blogs"))}>
                Blogs
              </Link>
              <Link to="/about" className={navLinkClass(isActive("/about"))}>
                About
              </Link>
              <button onClick={() => scrollToSection("contact-section")} className={navLinkClass(false)}>
                Contact
              </button>
            </>
          )}

          {isEcommerceEnabled && (
            <Link to="/shop" className={navLinkClass(isActive("/shop"))}>
              Shop
            </Link>
          )}
        </div>

        {/* Right — CTA / Account */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {!isShopPage && (
            <button
              onClick={() => scrollToSection("contact-section")}
              className="inline-flex items-center justify-center h-10 px-5 rounded-md bg-foreground text-background text-[13px] font-semibold tracking-wide hover:bg-foreground/85 transition-colors duration-200"
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
                    className="relative text-foreground/70 hover:text-foreground hover:bg-secondary"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Button>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="bg-foreground hover:bg-foreground/85 text-background h-10 px-4 rounded-md"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Account
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-4 rounded-md"
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
              className="relative text-foreground/70 hover:text-foreground"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>
          )}
          <button
            className="p-2 text-foreground rounded-md hover:bg-secondary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-border shadow-md overflow-hidden">
          <div className="py-6 max-h-[calc(100vh-5.5rem)] overflow-y-auto">
            <div className="flex flex-col gap-1 px-6">
              <Link
                to="/"
                className="block text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors duration-200 font-medium py-3 px-4 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              {!isShopPage && (
                <>
                  <button
                    onClick={() => scrollToSection("gallery-section")}
                    className="block w-full text-left text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors duration-200 font-medium py-3 px-4 rounded-md"
                  >
                    Gallery
                  </button>
                  <Link
                    to="/blogs"
                    className="block text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors duration-200 font-medium py-3 px-4 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Blogs
                  </Link>
                  <Link
                    to="/about"
                    className="block text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors duration-200 font-medium py-3 px-4 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About
                  </Link>
                  <button
                    onClick={() => scrollToSection("contact-section")}
                    className="block w-full text-left text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors duration-200 font-medium py-3 px-4 rounded-md"
                  >
                    Contact
                  </button>
                </>
              )}

              {isEcommerceEnabled && (
                <Link
                  to="/shop"
                  className="block text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors duration-200 font-medium py-3 px-4 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </Link>
              )}

              {!isShopPage && (
                <div className="pt-4 px-4">
                  <button
                    onClick={() => scrollToSection("contact-section")}
                    className="w-full inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-[13px] font-semibold tracking-wide"
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
                      className="w-full bg-foreground hover:bg-foreground/85 text-background h-11 rounded-md"
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
                      className="w-full bg-primary hover:bg-primary/90 h-11 rounded-md"
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

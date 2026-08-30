import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail, MapPin, Linkedin, Twitter, Instagram, Phone,
  ArrowUp, Send, ShieldCheck, Cpu, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { LegalModal } from "./LegalModal";
import { HelpCenterDialog, FAQDialog, CopyrightDialog, MadeInIndiaDialog, CareersDialog } from "./SupportDialogs";
import { cn } from "@/lib/utils";

const quickLinks = [
  { label: "Shop Products", href: "/shop" },
  { label: "Blogs & News", href: "/blogs" },
  { label: "About Us", href: "/about" },
  { label: "Request Custom Quote", href: "#contact-section" },
  { label: "Careers", action: "careers", href: "#" },
];

const supportLinks = [
  { label: "Help Center", action: "help", href: "#" },
  { label: "Order Tracking", href: "/dashboard", action: "link" },
  { label: "Verify Order / Scan QR", href: "/verify-order", action: "link" },
  { label: "FAQs", action: "faq", href: "#" },
];

const legalLinks = [
  { label: "Terms & Conditions", key: "terms" },
  { label: "Privacy Policy", key: "privacy" },
  { label: "Refund Policy", key: "refund" },
  { label: "Shipping Policy", key: "shipping" },
  { label: "Warranty Policy", key: "warranty" },
  { label: "Disclaimer", key: "disclaimer" },
];

export const PublicFooter = () => {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showCopyright, setShowCopyright] = useState(false);
  const [showMadeInIndia, setShowMadeInIndia] = useState(false);
  const [showCareers, setShowCareers] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubscribing) return;
    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        toast.success("Successfully subscribed to newsletter!");
      }
      setEmail("");
    } catch (err: any) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSupportClick = (e: React.MouseEvent, item: typeof supportLinks[0]) => {
    if (item.action === "help") {
      e.preventDefault();
      setShowHelpCenter(true);
    } else if (item.action === "faq") {
      e.preventDefault();
      setShowFAQ(true);
    }
  };

  const handleQuickLinkClick = (e: React.MouseEvent, item: typeof quickLinks[0]) => {
    if (item.action === "careers") {
      e.preventDefault();
      setShowCareers(true);
    }
  };

  return (
    <footer className="bg-[hsl(217,45%,9%)] text-white relative border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-7">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-md">
                <img src={logo} alt="Decouvertes Logo" className="h-9 w-auto" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-display text-lg font-bold text-white tracking-[0.16em] uppercase leading-none">
                  DECOUVERTES
                </span>
                <span className="font-display text-[10px] text-white/50 font-medium tracking-[0.22em] uppercase leading-tight mt-1.5">
                  Defence · Tech · India
                </span>
              </div>
            </div>

            <p className="text-white/55 text-sm leading-relaxed max-w-sm">
              Building the future of flight. Decouvertes designs indigenous drone platforms
              for surveillance, industrial, and mission-critical operations across India.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                Indigenous R&amp;D
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Secure Payments
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                <span className="text-xs">🇮🇳</span>
                Make in India
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Linkedin, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Instagram, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-md border border-white/15 hover:border-primary/50 hover:bg-white/5 flex items-center justify-center transition-colors duration-200"
                  aria-label="Social Link"
                >
                  <Icon className="w-4 h-4 text-white/60" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-3">
            <h3 className="font-semibold text-white mb-6 text-xs uppercase tracking-[0.16em]">
              Quick Actions
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.action ? (
                    <button
                      onClick={(e) => handleQuickLinkClick(e, link)}
                      className="text-white/55 hover:text-white transition-colors text-sm text-left"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link to={link.href} className="text-white/55 hover:text-white transition-colors text-sm">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-white mb-6 text-xs uppercase tracking-[0.16em]">
              Support
            </h3>
            <ul className="space-y-3 mb-8">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  {link.action === "link" ? (
                    <Link to={link.href} className="text-white/55 hover:text-white transition-colors text-sm">
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => handleSupportClick(e, link)}
                      className="text-white/55 hover:text-white transition-colors text-sm text-left"
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-white mb-4 text-xs uppercase tracking-[0.16em]">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.key}>
                  <button
                    onClick={() => setSelectedPolicy(link.key)}
                    className="text-white/40 hover:text-white/70 transition-colors text-xs text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div className="lg:col-span-3">
            <div className="border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2 text-sm">Stay Updated</h3>
              <p className="text-white/50 text-xs mb-4 leading-relaxed">
                Get the latest updates on new drone platforms, missions, and R&amp;D milestones.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/35 pl-10 h-10 text-sm focus-visible:ring-primary/50 rounded-md"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm font-medium rounded-md" disabled={isSubscribing}>
                  {isSubscribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <>Subscribe <Send className="w-3 h-3 ml-2" /></>}
                </Button>
              </form>
            </div>

            <div className="mt-8 space-y-4">
              <a href="mailto:hello@decouvertes.in" className="flex items-center gap-3 text-white/55 hover:text-white transition-colors text-sm">
                <Mail className="w-4 h-4 text-white/35" />
                hello@decouvertes.in
              </a>
              <a href="tel:+919561103435" className="flex items-center gap-3 text-white/55 hover:text-white transition-colors text-sm">
                <Phone className="w-4 h-4 text-white/35" />
                +91 9561103435
              </a>
              <div className="flex items-start gap-3 text-white/50 text-xs leading-relaxed">
                <MapPin className="w-4 h-4 shrink-0 text-white/35 mt-0.5" />
                <span>A-414, Gera's Imperium Gateway, Near Nashik Phata Flyover, Opp. Bhosari Metro Station, Kasarwadi, Pimpri-Chinchwad, Pune, Maharashtra – 411034, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            onClick={() => setShowCopyright(true)}
            className="text-white/40 text-sm hover:text-white/70 transition-colors text-left"
          >
            © {new Date().getFullYear()} DECOUVERTES. All rights reserved.
          </button>
          <button
            onClick={() => setShowMadeInIndia(true)}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-md border border-white/10 hover:border-primary/40 transition-colors"
          >
            <span className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Made in <span className="text-primary">India</span>
            </span>
          </button>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-24 right-6 p-3 rounded-md bg-foreground text-background shadow-elevated hover:bg-foreground/85 transition-all duration-300 z-50",
          showBackToTop ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"
        )}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      <LegalModal
        isOpen={!!selectedPolicy}
        policyKey={selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
      />

      <HelpCenterDialog
        isOpen={showHelpCenter}
        onClose={() => setShowHelpCenter(false)}
      />

      <FAQDialog
        isOpen={showFAQ}
        onClose={() => setShowFAQ(false)}
      />

      <CopyrightDialog
        isOpen={showCopyright}
        onClose={() => setShowCopyright(false)}
      />

      <MadeInIndiaDialog
        isOpen={showMadeInIndia}
        onClose={() => setShowMadeInIndia(false)}
      />

      <CareersDialog
        isOpen={showCareers}
        onClose={() => setShowCareers(false)}
      />
    </footer>
  );
};

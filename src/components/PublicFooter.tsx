import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, MapPin, Linkedin, Twitter, Instagram, Phone, 
  ArrowUp, Send, ShieldCheck, Cpu, ChevronRight, Loader2
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
    <footer className="bg-[hsl(222,30%,6%)] text-white relative overflow-hidden border-t border-white/5">
      {/* Engineering grid overlay */}
      <div className="absolute inset-0 grid-engineering-dark opacity-60 pointer-events-none" />
      {/* Orange horizon glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.10), transparent 70%)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/70 hover:bg-white rounded-xl transition-colors duration-300">
                <img 
                  src={logo} 
                  alt="Decouvertes Logo" 
                  className="h-10 w-auto"
                />
              </div>
              <div className="flex flex-col justify-center">
                <span
                  className="font-display text-xl font-bold text-white tracking-[0.22em] uppercase leading-none"
                >
                  DECOUVERTES
                </span>
                <span
                  className="font-display text-[10px] text-primary font-medium tracking-[0.32em] uppercase leading-tight mt-1"
                >
                  Defence · Tech · India
                </span>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Building the future of flight. Decouvertes designs indigenous drone platforms
              for surveillance, industrial, and mission-critical operations across India.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-slate-300">Indigenous R&D</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-slate-300">Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                <span className="text-xs">🇮🇳</span>
                <span className="text-xs font-medium text-slate-300">Make in India</span>
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
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 flex items-center justify-center transition-all duration-300 group"
                  aria-label="Social Link"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Quick Actions
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.action ? (
                    <button
                      onClick={(e) => handleQuickLinkClick(e, link)}
                      className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center gap-2 group w-fit text-left"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-primary transition-colors" />
                      {link.label}
                    </button>
                  ) : (
                    <Link 
                      to={link.href} 
                      className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center gap-2 group w-fit"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-primary transition-colors" />
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Support
            </h3>
            <ul className="space-y-3 mb-8">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  {link.action === "link" ? (
                    <Link 
                      to={link.href} 
                      className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center gap-2 group w-fit"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => handleSupportClick(e, link)}
                      className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center gap-2 group w-fit text-left"
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.key}>
                  <button 
                    onClick={() => setSelectedPolicy(link.key)}
                    className="text-slate-500 hover:text-slate-300 transition-colors text-xs flex items-center gap-1 group text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-white mb-2">Stay Updated</h3>
              <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                Get the latest updates on new drone platforms, missions, and R&D milestones.
              </p>
              
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 pl-10 h-10 text-sm focus-visible:ring-primary/50"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm font-medium" disabled={isSubscribing}>
                  {isSubscribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <>Subscribe <Send className="w-3 h-3 ml-2" /></>}
                </Button>
              </form>
            </div>

            <div className="mt-8 space-y-4">
              <a href="mailto:hello@decouvertes.in" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/20 transition-colors border border-white/5 group-hover:border-primary/20">
                  <Mail className="w-4 h-4 group-hover:text-primary transition-colors" />
                </div>
                hello@decouvertes.in
              </a>
              <a href="tel:+919561103435" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/20 transition-colors border border-white/5 group-hover:border-primary/20">
                  <Phone className="w-4 h-4 group-hover:text-primary transition-colors" />
                </div>
                +91 9561103435
              </a>
              <div className="flex items-start gap-3 text-slate-400 text-sm">
                <div className="p-2 bg-white/5 rounded-lg shrink-0 border border-white/5">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="leading-relaxed text-xs">A-414, Gera's Imperium Gateway, Near Nashik Phata Flyover, Opp. Bhosari Metro Station, Kasarwadi, Pimpri-Chinchwad, Pune, Maharashtra – 411034, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <button 
            onClick={() => setShowCopyright(true)}
            className="text-slate-500 text-sm hover:text-slate-300 transition-colors text-left"
          >
            © {new Date().getFullYear()} DECOUVERTES. All rights reserved.
          </button>
          <div className="flex items-center gap-4">
             <button
               onClick={() => setShowMadeInIndia(true)}
               className="group inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-primary/40 transition-all"
             >
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70 group-hover:text-white">
                Made in <span className="text-primary">India</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-8 right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-300 z-50 group",
          showBackToTop ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
        )}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
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
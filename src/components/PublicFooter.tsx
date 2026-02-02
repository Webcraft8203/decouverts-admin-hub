import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Mail, MapPin, Linkedin, Twitter, Instagram, Phone, 
  ArrowUp, Send, ShieldCheck, Cpu, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { LegalModal } from "./LegalModal";
import { HelpCenterDialog, FAQDialog, CopyrightDialog, MadeInIndiaDialog, CareersDialog } from "./SupportDialogs";
import { cn } from "@/lib/utils";

const quickLinks = [
  { label: "Configure 3D Printer", href: "/printer-configuration" },
  { label: "Request Custom Quote", href: "#contact-section" },
  { label: "Engineering Services", href: "/engineering" },
  { label: "Industrial Solutions", href: "/manufacturing" },
  { label: "Shop Products", href: "/shop" },
  { label: "Careers", action: "careers", href: "#" },
];

const supportLinks = [
  { label: "Help Center", action: "help", href: "#" },
  { label: "Order Tracking", href: "/dashboard", action: "link" },
  { label: "Verify Order / Scan QR", href: "/verify-order", action: "link" },
  { label: "FAQs", action: "faq", href: "#" },
  { label: "Employee Login", href: "/employee-login", action: "link" },
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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Successfully subscribed to newsletter!");
    setEmail("");
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
    <footer className="bg-slate-950 text-white relative overflow-hidden border-t border-slate-900">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/70 hover:bg-white rounded-xl transition-colors duration-300">
                <img 
                  src={logo} 
                  alt="Decouverts Plus" 
                  className="h-10 w-auto"
                />
              </div>
              <div className="flex flex-col justify-center">
                <span 
                  className="text-xl font-bold text-white tracking-[0.15em] uppercase leading-none"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  DECOUVERTS
                </span>
                <span 
                  className="text-[10px] text-primary font-medium tracking-wider leading-tight mt-0.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Discovering Future Technologies
                </span>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Engineering the future through innovation. We specialize in advanced 3D printing, 
              drone technology, and new product development for enterprises worldwide.
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
                Get the latest updates on new products, research, and industrial innovations.
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
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm font-medium">
                  Subscribe <Send className="w-3 h-3 ml-2" />
                </Button>
              </form>
            </div>

            <div className="mt-8 space-y-4">
              <a href="mailto:contact@decouverts.com" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/20 transition-colors border border-white/5 group-hover:border-primary/20">
                  <Mail className="w-4 h-4 group-hover:text-primary transition-colors" />
                </div>
                hello@decouverts.com
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
                <span className="leading-relaxed text-xs">Megapolis Springs, Phase 3, Hinjawadi Rajiv Gandhi Infotech Park, Pune, Maharashtra, India</span>
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
            © {new Date().getFullYear()} Decouverts. All rights reserved.
          </button>
          <div className="flex items-center gap-6">
             <button 
               onClick={() => setShowMadeInIndia(true)}
               className="text-slate-500 text-sm flex items-center gap-2 hover:text-primary transition-colors group"
             >
              Proudly Made in <span className="text-primary font-medium group-hover:underline">India</span> 🇮🇳
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
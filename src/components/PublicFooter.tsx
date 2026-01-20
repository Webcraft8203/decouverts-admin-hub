import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, ArrowRight, Linkedin, Twitter, Instagram, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { LegalModal } from "./LegalModal";

const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Our Services", href: "#services-section" },
    { label: "Contact", href: "#contact-section" },
  ],
  services: [
    { label: "3D Printing", href: "/engineering" },
    { label: "Product Development", href: "/engineering" },
    { label: "Drone Technology", href: "/manufacturing" },
  ],
  shop: [
    { label: "All Products", href: "/shop" },
    { label: "New Arrivals", href: "/shop" },
    { label: "Best Sellers", href: "/shop" },
  ],
};

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

  return (
    <footer className="bg-dark text-white relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-dark opacity-30" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white rounded-xl backdrop-blur">
                <img 
                  src={logo} 
                  alt="Decouverts Plus" 
                  className="h-10 w-auto"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-wide">Decouverts</span>
                <p className="text-xs text-primary font-medium">Discovering Future Technologies</p>
              </div>
            </div>
            <p className="text-dark-muted text-sm leading-relaxed mb-8 max-w-sm">
              Engineering the future through innovation. We specialize in advanced 3D printing, 
              drone technology, and new product development for enterprises worldwide.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <a href="mailto:contact@decouverts.com" className="flex items-center gap-3 text-dark-muted hover:text-primary transition-colors text-sm group">
                <div className="p-2 bg-dark-elevated rounded-lg group-hover:bg-primary/10 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                contact@decouverts.com
              </a>
              <a href="tel:+919561103435" className="flex items-center gap-3 text-dark-muted hover:text-primary transition-colors text-sm group">
                <div className="p-2 bg-dark-elevated rounded-lg group-hover:bg-primary/10 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                +91 9561103435
              </a>
              <div className="flex items-start gap-3 text-dark-muted text-sm">
                <div className="p-2 bg-dark-elevated rounded-lg shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="leading-relaxed">Pune, Maharashtra, India</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-8">
              {[
                { icon: Linkedin, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Instagram, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-10 h-10 rounded-xl bg-dark-elevated hover:bg-primary/20 border border-dark-border hover:border-primary/30 flex items-center justify-center transition-all duration-300 group"
                >
                  <Icon className="w-4 h-4 text-dark-muted group-hover:text-primary" />
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-white mb-6 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-dark-muted hover:text-primary transition-colors text-sm flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="font-semibold text-white mb-6 text-sm uppercase tracking-wider">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-dark-muted hover:text-primary transition-colors text-sm flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold text-white mb-6 text-sm uppercase tracking-wider">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-dark-muted hover:text-primary transition-colors text-sm flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-white mb-6 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.key}>
                  <button 
                    onClick={() => setSelectedPolicy(link.key)}
                    className="text-dark-muted hover:text-primary transition-colors text-sm flex items-center gap-1 group text-left"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-dark-border mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-dark-muted text-sm">
            © {new Date().getFullYear()} Decouverts. All rights reserved.
          </p>
          <p className="text-dark-muted text-sm flex items-center gap-2">
            Proudly Made in <span className="text-primary font-medium">India</span> 🇮🇳
          </p>
        </div>
      </div>

      <LegalModal 
        isOpen={!!selectedPolicy} 
        policyKey={selectedPolicy} 
        onClose={() => setSelectedPolicy(null)} 
      />
    </footer>
  );
};
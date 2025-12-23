import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const PublicFooter = () => {
  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Decouverts Plus" 
                className="h-10 w-auto brightness-0 invert"
              />
              <span className="text-lg font-bold">Decouverts Plus</span>
            </div>
            <p className="text-accent-foreground/70 text-sm">
              Your destination for premium quality products. Discover excellence with every purchase.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-primary">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-accent-foreground/70 hover:text-primary transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-accent-foreground/70 hover:text-primary transition-colors text-sm">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-accent-foreground/70 hover:text-primary transition-colors text-sm">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-primary">Contact</h3>
            <ul className="space-y-2 text-sm text-accent-foreground/70">
              <li>Email: contact@decouvertsplus.com</li>
              <li>Phone: +1 (555) 123-4567</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-accent-foreground/10 mt-8 pt-8 text-center">
          <p className="text-accent-foreground/50 text-sm">
            © {new Date().getFullYear()} Decouverts Plus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

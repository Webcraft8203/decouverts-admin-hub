import { ReactNode } from "react";
import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ShoppingBag, MapPin, FileText, User, ShoppingCart } from "lucide-react";

interface UserLayoutProps {
  children: ReactNode;
}

const userNavItems = [
  { title: "My Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { title: "My Cart", href: "/dashboard/cart", icon: ShoppingCart },
  { title: "Addresses", href: "/dashboard/addresses", icon: MapPin },
  { title: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { title: "Profile", href: "/dashboard/profile", icon: User },
];

export const UserLayout = ({ children }: UserLayoutProps) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="bg-card border border-border rounded-xl p-4 sticky top-24">
                <h2 className="font-semibold text-foreground mb-4 px-3">My Account</h2>
                <ul className="space-y-1">
                  {userNavItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          location.pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

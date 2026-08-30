import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

const NotFound = () => {
  const location = useLocation();

  usePageSEO({
    title: "Page Not Found | Decouvertes",
    description: "The page you are looking for does not exist. Return to Decouvertes homepage for indigenous drone technology.",
    path: location.pathname,
  });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-6 pt-16 pb-24">
        <div className="text-center max-w-md">
          <p className="font-display text-7xl font-bold text-foreground tracking-tight mb-4">404</p>
          <div className="w-10 h-px bg-primary mx-auto mb-6" />
          <h1 className="text-2xl font-semibold text-foreground mb-3">Page not found</h1>
          <p className="text-muted-foreground leading-relaxed mb-8">
            The page you're looking for doesn't exist or may have moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-foreground text-background text-sm font-semibold hover:bg-foreground/85 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default NotFound;

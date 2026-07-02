import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  short_description: string | null;
  price: number;
  images: string[] | null;
  categories: { name: string } | null;
  is_highlighted: boolean;
  is_bestseller: boolean | null;
  is_new_arrival: boolean | null;
  is_coming_soon: boolean | null;
  is_pre_order: boolean | null;
  slug: string | null;
}

interface Props {
  product: Product;
}

export function SimpleProductCard({ product }: Props) {
  const href = `/product/${product.slug || product.id}`;
  const image = product.images?.[0];

  const badge =
    (product.is_highlighted && "Featured") ||
    (product.is_bestseller && "Best Seller") ||
    (product.is_new_arrival && "New") ||
    null;

  const availability = product.is_coming_soon
    ? "Coming Soon"
    : product.is_pre_order
    ? "Pre-Order"
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col bg-card rounded-2xl border border-border/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40"
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
        {badge && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground shadow-sm">
            {badge}
          </span>
        )}
        {availability && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-foreground/90 text-background shadow-sm">
            {availability}
          </span>
        )}
      </div>

      {/* Image */}
      <Link to={href} className="block relative aspect-[4/3] overflow-hidden bg-secondary/30">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-14 h-14 text-muted-foreground/30" />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-6 pt-5">
        {product.categories?.name && (
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium mb-2">
            {product.categories.name}
          </div>
        )}

        <Link to={href}>
          <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.short_description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        )}

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            {product.price > 0 ? (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Starting at
                </div>
                <div className="text-xl font-bold text-foreground tracking-tight">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </div>
              </>
            ) : (
              <div className="text-sm font-semibold text-foreground">On Request</div>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-border/70 hover:bg-secondary/60 font-medium text-sm"
          >
            <Link to={href}>
              Explore
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button
            asChild
            className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-sm"
          >
            <Link to={`/contact?product=${encodeURIComponent(product.name)}`}>
              Get Quote
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

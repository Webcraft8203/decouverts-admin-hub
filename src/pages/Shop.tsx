import { useState, useMemo, useEffect } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { BreadcrumbSchema } from "@/components/SEOSchemas";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { ShopHeroSlider } from "@/components/shop/ShopHeroSlider";
import { CategoryPills } from "@/components/shop/CategoryPills";
import { ShopFilterBar } from "@/components/shop/ShopFilterBar";
import { SimpleProductCard } from "@/components/shop/SimpleProductCard";

interface Product {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  stock_quantity: number;
  images: string[] | null;
  category_id: string | null;
  is_highlighted: boolean;
  is_bestseller: boolean | null;
  is_new_arrival: boolean | null;
  is_coming_soon: boolean | null;
  is_pre_order: boolean | null;
  is_discontinued: boolean | null;
  brand: string | null;
  categories: { name: string } | null;
  sku: string | null;
  slug: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [availability, setAvailability] = useState("all");

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_discontinued", false as any)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const filteredProducts = useMemo(() => {
    return (products || [])
      .filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.short_description?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q);
        const matchesCategory =
          !selectedCategory || p.category_id === selectedCategory;
        const matchesAvail =
          availability === "all" ||
          (availability === "in_stock" &&
            p.stock_quantity > 0 &&
            !p.is_coming_soon &&
            !p.is_pre_order) ||
          (availability === "coming_soon" && p.is_coming_soon) ||
          (availability === "pre_order" && p.is_pre_order);
        return matchesSearch && matchesCategory && matchesAvail;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return a.price - b.price;
          case "price-high":
            return b.price - a.price;
          case "name":
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [products, searchQuery, selectedCategory, availability, sortBy]);

  const selectedCategoryName = selectedCategory
    ? categories?.find((c) => c.id === selectedCategory)?.name
    : null;

  usePageSEO({
    title: selectedCategoryName
      ? `${selectedCategoryName} | Shop | Decouvertes`
      : "Shop | Drones, 3D Printers & Smart Systems | Decouvertes",
    description: selectedCategoryName
      ? `Explore ${selectedCategoryName} from Decouvertes — precision engineered products for professionals.`
      : "Shop drones, 3D printers, agriculture systems and smart devices from Decouvertes — engineered in India.",
    path: "/shop",
  });

  useEffect(() => {
    if (!filteredProducts?.length) return;
    const itemListLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: selectedCategoryName
        ? `${selectedCategoryName} Products`
        : "All Products",
      numberOfItems: filteredProducts.length,
      itemListElement: filteredProducts.slice(0, 30).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.decouvertes.in/product/${p.slug || p.id}`,
        name: p.name,
        image: p.images?.[0],
      })),
    };
    const script = document.createElement("script");
    script.id = "shop-itemlist-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(itemListLd);
    document.head.appendChild(script);
    return () => {
      document.getElementById("shop-itemlist-jsonld")?.remove();
    };
  }, [filteredProducts, selectedCategoryName]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
          ...(selectedCategoryName
            ? [{ name: selectedCategoryName, url: "/shop" }]
            : []),
        ]}
      />
      <PublicNavbar />

      <main className="flex-1 pt-16">
        {/* Cinematic hero — admin-managed slides only */}
        <ShopHeroSlider />

        {/* Category pills */}
        <CategoryPills
          categories={categories || []}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Catalogue */}
        <section id="shop-catalogue" className="py-14 lg:py-20">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {selectedCategoryName || "All Products"}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Precision engineered products for professionals.
              </p>
            </div>

            <ShopFilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              availability={availability}
              setAvailability={setAvailability}
              resultCount={filteredProducts.length}
            />

            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border/60 overflow-hidden bg-card"
                  >
                    <Skeleton className="aspect-[4/3]" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((p) => (
                  <SimpleProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 rounded-2xl border border-dashed border-border/50 bg-card/40">
                <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1.5">
                  No products found
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Try adjusting your search or filters.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(null);
                    setAvailability("all");
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Shop;

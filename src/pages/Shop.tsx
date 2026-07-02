import { useState, useEffect, useMemo } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { BreadcrumbSchema } from "@/components/SEOSchemas";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { FullscreenQuickView } from "@/components/shop/FullscreenQuickView";
import { AerospaceHero } from "@/components/shop/AerospaceHero";
import { FeatureBar } from "@/components/shop/FeatureBar";
import { AerospaceCategories } from "@/components/shop/AerospaceCategories";
import { CommandCenterSearch } from "@/components/shop/CommandCenterSearch";
import { EngineeredProductCard } from "@/components/shop/EngineeredProductCard";
import { CompareDock } from "@/components/shop/CompareDock";
import { CompareDialog } from "@/components/shop/CompareDialog";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  made_in_india: boolean | null;
  brand: string | null;
  applications: string[] | null;
  categories: { name: string } | null;
  sku: string | null;
  slug: string | null;
  mission_type: string | null;
  model_3d_url: string | null;
}

interface Category { id: string; name: string; description: string | null }

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [missionFilter, setMissionFilter] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

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
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  // Batch fetch top 3 highlights per product for quick-spec strip
  const { data: highlightsMap } = useQuery({
    queryKey: ["public-product-highlights"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_highlights")
        .select("product_id, label, value, display_order")
        .order("display_order", { ascending: true });
      const map = new Map<string, { label: string; value: string }[]>();
      (data || []).forEach((h: any) => {
        const arr = map.get(h.product_id) || [];
        if (arr.length < 3) arr.push({ label: h.label, value: h.value });
        map.set(h.product_id, arr);
      });
      return map;
    },
  });

  const missionTypes = useMemo(() => {
    return Array.from(new Set((products || []).map((p) => p.mission_type).filter(Boolean) as string[])).sort();
  }, [products]);

  const priceBounds: [number, number] = useMemo(() => {
    if (!products || products.length === 0) return [0, 100000];
    const prices = products.map((p) => p.price).filter((p) => p > 0);
    if (prices.length === 0) return [0, 100000];
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);

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
          p.mission_type?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q);
        const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
        const matchesMission = missionFilter === "all" || p.mission_type === missionFilter;
        const matchesAvail =
          availability === "all" ||
          (availability === "in_stock" && p.stock_quantity > 0 && !p.is_coming_soon && !p.is_pre_order) ||
          (availability === "coming_soon" && p.is_coming_soon) ||
          (availability === "pre_order" && p.is_pre_order);
        const matchesPrice = !priceRange || (p.price >= priceRange[0] && p.price <= priceRange[1]);
        return matchesSearch && matchesCategory && matchesMission && matchesAvail && matchesPrice;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price-low": return a.price - b.price;
          case "price-high": return b.price - a.price;
          case "name": return a.name.localeCompare(b.name);
          default: return 0;
        }
      });
  }, [products, searchQuery, selectedCategory, missionFilter, availability, priceRange, sortBy]);

  const selectedCategoryName = selectedCategory
    ? categories?.find((c) => c.id === selectedCategory)?.name
    : null;

  usePageSEO({
    title: selectedCategoryName
      ? `${selectedCategoryName} | Platforms | Decouvertes`
      : "UAV Platforms & Deep-Tech Systems | Decouvertes",
    description: selectedCategoryName
      ? `Explore ${selectedCategoryName} platforms from Decouvertes — engineered in India for defence, agriculture, industrial inspection and research missions.`
      : "Purpose-built UAVs, defence systems, agriculture drones, industrial inspection platforms and 3D printers — engineered in India by Decouvertes.",
    path: "/shop",
  });

  useEffect(() => {
    if (!filteredProducts?.length) return;
    const itemListLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: selectedCategoryName ? `${selectedCategoryName} Platforms` : "All Platforms",
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
    return () => { document.getElementById("shop-itemlist-jsonld")?.remove(); };
  }, [filteredProducts, selectedCategoryName]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
          ...(selectedCategoryName ? [{ name: selectedCategoryName, url: "/shop" }] : []),
        ]}
      />
      <PublicNavbar />

      <main className="flex-1 pt-16">
        <AerospaceHero />
        <FeatureBar />
        <AerospaceCategories selectedId={selectedCategory} onSelect={setSelectedCategory} />

        <CommandCenterSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories || []}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          missionFilter={missionFilter}
          setMissionFilter={setMissionFilter}
          availability={availability}
          setAvailability={setAvailability}
          sortBy={sortBy}
          setSortBy={setSortBy}
          priceBounds={priceBounds}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          missionTypes={missionTypes}
          resultCount={filteredProducts.length}
        />

        {/* Catalogue */}
        <section id="shop-catalogue" className="relative pb-24">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary mb-2">
                  Platform Catalogue
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {selectedCategoryName || "All Engineered Platforms"}
                </h2>
              </div>
              <div className="text-xs font-mono text-muted-foreground hidden sm:block">
                {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
              </div>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border/40 overflow-hidden bg-card">
                    <Skeleton className="aspect-[4/3]" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredProducts.map((p) => (
                  <EngineeredProductCard
                    key={p.id}
                    product={p}
                    specs={highlightsMap?.get(p.id) || []}
                    onQuickView={setQuickViewId}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 rounded-2xl border border-dashed border-border/50 bg-card/40">
                <div className="w-16 h-16 rounded-2xl bg-secondary/40 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1.5">
                  No platforms match your criteria
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Adjust filters or clear your search to view all platforms.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(null);
                    setMissionFilter("all");
                    setAvailability("all");
                    setPriceRange(null);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <QuickViewModal
        productId={quickViewId}
        open={!!quickViewId}
        onOpenChange={(open) => { if (!open) setQuickViewId(null); }}
      />

      <PublicFooter />
    </div>
  );
};

export default Shop;

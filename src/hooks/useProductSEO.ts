import { useEffect } from "react";

interface ProductSEOData {
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  images: string[] | null;
  sku: string | null;
  hsn_code?: string | null;
  slug?: string | null;
  categories?: { name: string } | null;
}

const SITE_URL = "https://admin-craft-engine.lovable.app";

export const useProductSEO = (product: ProductSEOData | null | undefined) => {
  useEffect(() => {
    if (!product) return;

    const brandName = "DECOUVERTES";
    const category = (product.categories as any)?.name || "";
    const title = `${product.name} | ${category ? category + " | " : ""}${brandName}`.slice(0, 60);
    const description = (
      product.description?.replace(/<[^>]*>/g, "").slice(0, 150) ||
      `Buy ${product.name} from ${brandName}. Premium quality ${category || "product"} at ₹${product.price.toLocaleString("en-IN")}. Free shipping in India.`
    ).slice(0, 160);

    document.title = title;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("robots", "index, follow, max-image-preview:large");

    const productUrl = `${SITE_URL}/product/${product.slug || ""}`;

    // Open Graph
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "product", true);
    setMeta("og:url", productUrl, true);
    if (product.images?.[0]) {
      setMeta("og:image", product.images[0], true);
    }
    setMeta("og:site_name", brandName, true);
    setMeta("og:locale", "en_IN", true);

    // Product-specific OG tags
    setMeta("product:price:amount", String(product.price), true);
    setMeta("product:price:currency", "INR", true);
    setMeta("product:availability", product.stock_quantity > 0 ? "instock" : "oos", true);
    if (product.sku) setMeta("product:retailer_item_id", product.sku, true);
    setMeta("product:brand", brandName, true);

    // Twitter
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (product.images?.[0]) {
      setMeta("twitter:image", product.images[0]);
    }
    setMeta("twitter:label1", "Price");
    setMeta("twitter:data1", `₹${product.price.toLocaleString("en-IN")}`);
    setMeta("twitter:label2", "Availability");
    setMeta("twitter:data2", product.stock_quantity > 0 ? "In Stock" : "Out of Stock");

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", productUrl);

    // JSON-LD Product structured data (Google Rich Snippets)
    const availability =
      product.stock_quantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

    const jsonLd: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description?.replace(/<[^>]*>/g, "") || `${product.name} by ${brandName}`,
      brand: {
        "@type": "Brand",
        name: brandName,
      },
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: "INR",
        price: product.price,
        availability,
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: brandName,
        },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "IN",
          },
        },
      },
    };

    if (product.sku) jsonLd.sku = product.sku;
    if (product.hsn_code) jsonLd.mpn = product.hsn_code;
    if (product.images?.[0]) jsonLd.image = product.images;
    if (category) jsonLd.category = category;

    // BreadcrumbList for product page
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
        ...(category
          ? [{ "@type": "ListItem", position: 3, name: category, item: `${SITE_URL}/shop` }]
          : []),
        {
          "@type": "ListItem",
          position: category ? 4 : 3,
          name: product.name,
          item: productUrl,
        },
      ],
    };

    // Remove old JSON-LD
    document.getElementById("product-jsonld")?.remove();

    const script = document.createElement("script");
    script.id = "product-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify([jsonLd, breadcrumbLd]);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.title = "DECOUVERTES | Engineering, 3D Printing & Industrial Products India";
      document.getElementById("product-jsonld")?.remove();
      document.querySelector('link[rel="canonical"]')?.remove();
    };
  }, [product]);
};

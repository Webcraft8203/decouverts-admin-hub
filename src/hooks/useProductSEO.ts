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

export const useProductSEO = (product: ProductSEOData | null | undefined) => {
  useEffect(() => {
    if (!product) return;

    const brandName = "DECOUVERTES";
    const category = (product.categories as any)?.name || "";
    const title = `${product.name} | ${category ? category + " | " : ""}${brandName}`.slice(0, 60);
    const description = (
      product.description?.slice(0, 150) ||
      `Buy ${product.name} from ${brandName}. Premium quality ${category || "product"} at ₹${product.price.toLocaleString("en-IN")}.`
    ).slice(0, 160);

    // Set title
    document.title = title;

    // Set/update meta tags
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
    setMeta("robots", "index, follow");

    // Open Graph
    const productUrl = `${window.location.origin}/product/${product.slug || ""}`;
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "product", true);
    setMeta("og:url", productUrl, true);
    if (product.images?.[0]) {
      setMeta("og:image", product.images[0], true);
    }
    setMeta("og:site_name", brandName, true);

    // Twitter
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (product.images?.[0]) {
      setMeta("twitter:image", product.images[0]);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", productUrl);

    // JSON-LD Product structured data
    const availability =
      product.stock_quantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

    const jsonLd: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || `${product.name} by ${brandName}`,
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
        seller: {
          "@type": "Organization",
          name: brandName,
        },
      },
    };

    if (product.sku) jsonLd.sku = product.sku;
    if (product.hsn_code) jsonLd.mpn = product.hsn_code;
    if (product.images?.[0]) jsonLd.image = product.images;
    if (category) jsonLd.category = category;

    // Remove old JSON-LD
    const oldScript = document.getElementById("product-jsonld");
    if (oldScript) oldScript.remove();

    const script = document.createElement("script");
    script.id = "product-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.title = "DECOUVERTES - Discovering Future Technologies | Premium 3D Printers & Engineering Products";
      const jsonldScript = document.getElementById("product-jsonld");
      if (jsonldScript) jsonldScript.remove();
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      if (canonicalEl) canonicalEl.remove();
    };
  }, [product]);
};

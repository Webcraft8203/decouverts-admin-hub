import { useEffect } from "react";

interface PageSEOConfig {
  title: string;
  description: string;
  path: string;
  type?: string;
  image?: string;
  noindex?: boolean;
}

const BRAND = "Decouvertes";
const DEFAULT_TITLE = `${BRAND} | Engineering, 3D Printing & Industrial Products India`;
const SITE_URL = "https://www.decouvertes.in";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export const usePageSEO = (config: PageSEOConfig) => {
  useEffect(() => {
    const title = config.title.slice(0, 60);
    const description = config.description.slice(0, 160);
    const url = `${SITE_URL}${config.path}`;

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

    setMeta("application-name", BRAND);
    setMeta("apple-mobile-web-app-title", BRAND);
    setMeta("publisher", BRAND);
    setMeta("description", description);
    setMeta("robots", config.noindex ? "noindex, follow" : "index, follow");

    // Open Graph
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", config.type || "website", true);
    setMeta("og:url", url, true);
    setMeta("og:image", config.image || DEFAULT_IMAGE, true);
    setMeta("og:site_name", BRAND, true);

    // Twitter
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", config.image || DEFAULT_IMAGE);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    return () => {
      document.title = DEFAULT_TITLE;
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      if (canonicalEl) canonicalEl.remove();
    };
  }, [config.title, config.description, config.path, config.type, config.image, config.noindex]);
};

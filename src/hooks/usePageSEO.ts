import { useEffect } from "react";

interface PageSEOConfig {
  title: string;
  description: string;
  path: string;
  type?: string;
  image?: string;
  keywords?: string;
}

const BRAND = "DECOUVERTES";
const DEFAULT_TITLE = `${BRAND} | Engineering Services, 3D Printers, Drones & Industrial Products India`;
const SITE_URL = "https://decouvertsplus.vercel.app";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

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

    setMeta("description", description);
    setMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1");

    // Keywords
    if (config.keywords) {
      setMeta("keywords", config.keywords);
    }

    // Open Graph
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", config.type || "website", true);
    setMeta("og:url", url, true);
    setMeta("og:image", config.image || DEFAULT_IMAGE, true);
    setMeta("og:site_name", BRAND, true);
    setMeta("og:locale", "en_IN", true);

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
  }, [config.title, config.description, config.path, config.type, config.image, config.keywords]);
};

import { useEffect } from "react";

const SITE_URL = "https://www.decouvertes.in";

/**
 * Global WebSite structured data for all pages.
 * Injected once on mount, removed on unmount.
 */
export const SiteSchema = () => {
  useEffect(() => {
    const webSiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Decouvertes",
      alternateName: "Decouvertes India",
      url: `${SITE_URL}/`,
    };

    const script = document.createElement("script");
    script.id = "website-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(webSiteSchema);
    document.head.appendChild(script);

    return () => {
      document.getElementById("website-jsonld")?.remove();
    };
  }, []);

  return null;
};

/**
 * Organization structured data for homepage.
 * Injected once on mount, removed on unmount.
 */
export const OrganizationSchema = () => {
  useEffect(() => {
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Decouvertes",
      alternateName: "Decouvertes Future Tech Pvt. Ltd.",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        "Indigenous R&D-driven technology company specializing in 3D printers, drone systems, engineering services, and industrial products. Made in India.",
      foundingDate: "2023",
      address: {
        "@type": "PostalAddress",
        streetAddress: "A-414, Gera's Imperium Gateway, Near Nashik Phata Flyover, Opp. Bhosari Metro Station, Kasarwadi, Pimpri-Chinchwad",
        addressLocality: "Pune",
        addressRegion: "Maharashtra",
        postalCode: "411034",
        addressCountry: "IN",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-9561103435",
        contactType: "sales",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
      sameAs: [],
    };

    const script = document.createElement("script");
    script.id = "org-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(orgSchema);
    document.head.appendChild(script);

    return () => {
      document.getElementById("org-jsonld")?.remove();
    };
  }, []);

  return null;
};

/**
 * BreadcrumbList schema for any page.
 */
export const BreadcrumbSchema = ({
  items,
}: {
  items: { name: string; url: string }[];
}) => {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
      })),
    };

    const script = document.createElement("script");
    script.id = "breadcrumb-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.getElementById("breadcrumb-jsonld")?.remove();
    };
  }, [items]);

  return null;
};

/**
 * Blog Article structured data.
 */
export const ArticleSchema = ({
  title,
  description,
  image,
  datePublished,
  dateModified,
  author,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  author: string;
  url: string;
}) => {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      image: image || `${SITE_URL}/logo.png`,
      datePublished,
      dateModified,
      author: {
        "@type": "Person",
        name: author,
      },
      publisher: {
        "@type": "Organization",
        name: "Decouvertes",
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url.startsWith("http") ? url : `${SITE_URL}${url}`,
      },
    };

    const script = document.createElement("script");
    script.id = "article-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.getElementById("article-jsonld")?.remove();
    };
  }, [title, description, image, datePublished, dateModified, author, url]);

  return null;
};

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
        "Indigenous R&D-driven drone technology company. We design and manufacture next-generation UAV platforms in India.",
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

/**
 * Generic JSON-LD injector used by the schema helpers below.
 */
const useJsonLd = (id: string, schema: unknown, deps: unknown[]) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/**
 * LocalBusiness structured data — physical presence, NAP and geo.
 */
export const LocalBusinessSchema = () => {
  useJsonLd(
    "localbusiness-jsonld",
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#localbusiness`,
      name: "Decouvertes Future Technologies Pvt. Ltd.",
      alternateName: "Decouvertes",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
      image: `${SITE_URL}/og-image.png`,
      description:
        "Indian drone manufacturer and defence technology company developing UAV platforms, surveillance drones, autonomous systems and drone AI from Pune, Maharashtra.",
      telephone: "+91-9561103435",
      address: {
        "@type": "PostalAddress",
        streetAddress:
          "A-414, Gera's Imperium Gateway, Near Nashik Phata Flyover, Opp. Bhosari Metro Station, Kasarwadi, Pimpri-Chinchwad",
        addressLocality: "Pune",
        addressRegion: "Maharashtra",
        postalCode: "411034",
        addressCountry: "IN",
      },
      geo: { "@type": "GeoCoordinates", latitude: 18.6019, longitude: 73.8283 },
      areaServed: [
        { "@type": "Country", name: "India" },
        { "@type": "State", name: "Maharashtra" },
        { "@type": "City", name: "Pune" },
      ],
      knowsAbout: [
        "Drone manufacturing",
        "Defence drones",
        "Military UAV systems",
        "Counter drone systems",
        "Surveillance drones",
        "ISR solutions",
        "Autonomous drones",
        "Drone AI",
        "Aerospace engineering",
        "Robotics",
      ],
    },
    [],
  );
  return null;
};

/**
 * WebPage structured data for any route.
 */
export const WebPageSchema = ({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) => {
  useJsonLd(
    "webpage-jsonld",
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_URL}${path}#webpage`,
      name,
      description,
      url: `${SITE_URL}${path}`,
      inLanguage: "en-IN",
      isPartOf: { "@type": "WebSite", name: "Decouvertes", url: `${SITE_URL}/` },
      about: { "@type": "Organization", name: "Decouvertes Future Technologies Pvt. Ltd." },
    },
    [name, description, path],
  );
  return null;
};

/**
 * FAQPage structured data.
 */
export const FAQSchema = ({ faqs }: { faqs: { q: string; a: string }[] }) => {
  useJsonLd(
    "faq-jsonld",
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    [faqs],
  );
  return null;
};

/**
 * Service structured data for solution landing pages.
 */
export const ServiceSchema = ({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) => {
  useJsonLd(
    "service-jsonld",
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name,
      description,
      serviceType: name,
      url: `${SITE_URL}${path}`,
      areaServed: { "@type": "Country", name: "India" },
      provider: {
        "@type": "Organization",
        name: "Decouvertes Future Technologies Pvt. Ltd.",
        url: SITE_URL,
      },
    },
    [name, description, path],
  );
  return null;
};

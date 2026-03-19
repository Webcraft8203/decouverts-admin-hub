import { useEffect } from "react";

const SITE_URL = "https://www.decouvertes.in";

/**
 * Organization + WebSite + LocalBusiness structured data for homepage.
 */
export const OrganizationSchema = () => {
  useEffect(() => {
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": ["Organization", "LocalBusiness"],
      name: "DECOUVERTES",
      alternateName: ["Decouvertes Future Tech Pvt. Ltd.", "Decouvertes Future Tech", "DECOUVERTES India"],
      legalName: "Decouvertes Future Tech Pvt. Ltd.",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      image: `${SITE_URL}/logo.png`,
      description:
        "Indigenous R&D-driven technology company specializing in engineering services, industrial 3D printers (DFT Series), custom drone systems, manufacturing solutions, and premium industrial products. Made in India.",
      foundingDate: "2023",
      knowsAbout: [
        "Engineering Services",
        "3D Printing Technology",
        "Industrial 3D Printers",
        "Drone Systems",
        "Drone Technology",
        "Manufacturing Solutions",
        "Mechanical Engineering",
        "New Product Development",
        "CAD Design",
        "FEA Validation",
        "Prototyping",
        "Industrial Products"
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "DECOUVERTES Products & Services",
        itemListElement: [
          {
            "@type": "OfferCatalog",
            name: "Engineering Services",
            description: "Mechanical engineering NPD, CAD design, FEA validation & prototyping"
          },
          {
            "@type": "OfferCatalog",
            name: "Industrial 3D Printers",
            description: "DFT Series customizable industrial 3D printers for manufacturing"
          },
          {
            "@type": "OfferCatalog",
            name: "Drone Systems",
            description: "Custom FPV, surveillance & industrial drone solutions"
          },
          {
            "@type": "OfferCatalog",
            name: "Industrial Products",
            description: "Premium engineering tools, components & innovative products"
          }
        ]
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Megapolis Springs, Phase 3, Hinjawadi Rajiv Gandhi Infotech Park",
        addressLocality: "Pune",
        addressRegion: "Maharashtra",
        postalCode: "411057",
        addressCountry: "IN",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: "18.5913",
        longitude: "73.7389"
      },
      areaServed: {
        "@type": "Country",
        name: "India"
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+91-9561103435",
          contactType: "sales",
          areaServed: "IN",
          availableLanguage: ["English", "Hindi"],
        },
        {
          "@type": "ContactPoint",
          telephone: "+91-9561103435",
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["English", "Hindi"],
        }
      ],
      sameAs: [],
    };

    const webSiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "DECOUVERTES",
      alternateName: "Decouvertes Future Tech",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };

    const script = document.createElement("script");
    script.id = "org-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify([orgSchema, webSiteSchema]);
    document.head.appendChild(script);

    return () => {
      document.getElementById("org-jsonld")?.remove();
    };
  }, []);

  return null;
};

/**
 * Service structured data for engineering/manufacturing pages.
 */
export const ServiceSchema = ({
  name,
  description,
  url,
  serviceType,
  provider,
}: {
  name: string;
  description: string;
  url: string;
  serviceType: string;
  provider?: string;
}) => {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      name,
      description,
      url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
      serviceType,
      provider: {
        "@type": "Organization",
        name: provider || "DECOUVERTES",
        url: SITE_URL,
      },
      areaServed: {
        "@type": "Country",
        name: "India"
      },
    };

    const script = document.createElement("script");
    script.id = "service-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.getElementById("service-jsonld")?.remove();
    };
  }, [name, description, url, serviceType, provider]);

  return null;
};

/**
 * FAQ structured data for pages with FAQ content.
 */
export const FAQSchema = ({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) => {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    const script = document.createElement("script");
    script.id = "faq-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.getElementById("faq-jsonld")?.remove();
    };
  }, [faqs]);

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
        name: "DECOUVERTES",
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

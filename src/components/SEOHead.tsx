import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
}

const SEOHead = ({
  title = "",
  description = "",
  keywords = "",
  image = "",
  type = "website"
}: SEOHeadProps) => {
  const location = useLocation();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const currentUrl = `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };

    // Basic meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);
    updateMetaTag("author", "");

    // Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:url", currentUrl, true);
    updateMetaTag("og:image", `${baseUrl}${image}`, true);
    updateMetaTag("og:site_name", "", true);
    updateMetaTag("og:locale", "vi_VN", true);

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", `${baseUrl}${image}`);

    // Additional SEO tags
    updateMetaTag("robots", "index, follow");
    updateMetaTag("language", "Vietnamese");
    updateMetaTag("revisit-after", "7 days");
    updateMetaTag("geo.region", "VN");
    updateMetaTag("geo.placename", "Vietnam");

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", currentUrl);

    // JSON-LD structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "",
      "jobTitle": "",
      "description": description,
      "url": baseUrl,
      "image": `${baseUrl}${image}`,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "VN"
      },
      "sameAs": [
        // Social media links will be dynamically added from database
      ],
      "knowsAbout": [
        "Sales Management",
        "Business Development",
        "Market Expansion",
        "Strategic Partnerships",
        "Revenue Growth",
        "Team Leadership",
        "B2B Sales",
        "Commercial Strategy"
      ],
      "alumniOf": {
        "@type": "EducationalOrganization",
        "name": "University Education"
      }
    };

    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.setAttribute("type", "application/ld+json");
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);

  }, [title, description, keywords, image, type, location.pathname]);

  return null;
};

export default SEOHead;

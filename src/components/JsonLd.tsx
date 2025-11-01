import React from "react";

interface JsonLdProps {
    data: object;
  }
  
  export function JsonLd({ data }: JsonLdProps) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    );
  }
  
  export const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Atmaca Spotting Team",
    "description": "Türkiye'nin önde gelen havacılık spotting topluluğu",
    "url": "https://atmacaspotting.com",
    "logo": "https://atmacaspotting.com/atmaca-logo.jpg",
    "sameAs": [
      "https://instagram.com/atmacaspotting"
    ]
  };
  
  export const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Atmaca Spotting Team",
    "url": "https://atmacaspotting.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://atmacaspotting.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
  
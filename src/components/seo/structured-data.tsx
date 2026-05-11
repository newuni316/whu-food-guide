interface StructuredDataProps {
  type: "website" | "restaurant" | "breadcrumb"
  data?: Record<string, unknown>
}

export function StructuredData({ type, data }: StructuredDataProps) {
  let jsonLd: Record<string, unknown> = {}

  if (type === "website") {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "武大美食指北",
      alternateName: "WHU Food Guide",
      url: "https://whu-food.vercel.app",
      description: "武汉大学校园美食平台 — 分区浏览、美食地图、排行榜",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://whu-food.vercel.app/explore?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    }
  } else if (type === "restaurant" && data) {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: data.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: "武汉市",
        addressRegion: "湖北省",
        streetAddress: data.address,
      },
      aggregateRating: data.rating
        ? {
            "@type": "AggregateRating",
            ratingValue: data.rating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: data.reviewCount || 1,
          }
        : undefined,
      priceRange: data.priceRange,
      openingHours: data.hours,
      geo: data.coordinates
        ? {
            "@type": "GeoCoordinates",
            latitude: (data.coordinates as { lat: number }).lat,
            longitude: (data.coordinates as { lng: number }).lng,
          }
        : undefined,
    }
  } else if (type === "breadcrumb" && data?.items) {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: (data.items as Array<{ name: string; url: string }>).map(
        (item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })
      ),
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

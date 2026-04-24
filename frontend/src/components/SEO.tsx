import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  canonical?: string;
}

const SEO = ({
  title = "Samalocation - Simplifiez la gestion locative au Sénégal",
  description = "Plateforme intelligente de gestion locative en ligne au Sénégal. Gérez vos biens, trouvez un logement facilement en ligne.",
  keywords = "Samalocation, gestion locative, Sénégal, location, immobilier, dakar, appartement",
  image = "https://samalocation.com/logo-sl.png",
  url = "https://samalocation.com/",
  type = "website",
  author = "Samalocation",
  canonical,
}: SEOProps) => {
  const siteTitle = title.includes("Samalocation") ? title : `${title} | Samalocation`;
  const siteUrl = canonical || url;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={siteUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={siteUrl} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@Samalocation" />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === "website" ? "Organization" : "RealEstateListing",
          "name": "Samalocation",
          "url": "https://samalocation.com",
          "logo": "https://samalocation.com/logo-sl.png",
          "description": description,
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "SN",
            "addressLocality": "Dakar"
          },
          "sameAs": [
            "https://facebook.com/samalocation",
            "https://twitter.com/samalocation",
            "https://instagram.com/samalocation"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;

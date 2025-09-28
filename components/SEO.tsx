import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: string
  noindex?: boolean
}

export default function SEO({
  title,
  description,
  keywords = [],
  image = '/main.png',
  url,
  type = 'website',
  noindex = false
}: SEOProps) {
  const siteTitle = title 
    ? `${title} | SafeEntry - Digital Health Records`
    : 'SafeEntry - Secure Digital Health Records for Migrant Workers'
  
  const siteDescription = description || 
    'Transform your healthcare with SafeEntry - Your digital companion for health record management, document submissions, and personalized health insights.'
  
  const siteUrl = url ? `https://safeentry.app${url}` : 'https://safeentry.app'
  const imageUrl = image.startsWith('http') ? image : `https://safeentry.app${image}`
  
  const allKeywords = [
    'medication reminder',
    'health app',
    'AI health assistant',
    'prescription tracker',
    'medication management',
    'healthcare app',
    'pill reminder',
    'health chatbot',
    'medical AI',
    'prescription analysis',
    ...keywords
  ].join(', ')

  return (
    <Head>
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={allKeywords} />
      
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={title || 'SafeEntry - Digital Health Records'} />
      <meta property="og:site_name" content="SafeEntry" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:creator" content="@safeentry" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={siteUrl} />
      
      {/* Additional meta tags */}
      <meta name="author" content="Sujay Babu Thota" />
      <meta name="publisher" content="Asvix" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": siteTitle,
            "description": siteDescription,
            "url": siteUrl,
            "image": imageUrl,
            "author": {
              "@type": "Person",
              "name": "Sujay Babu Thota"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Asvix",
              "logo": {
                "@type": "ImageObject",
                "url": "https://safeentry.app/kerala-digital-health-logo.svg"
              }
            },
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "SafeEntry",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Web, Android, iOS"
            }
          })
        }}
      />
    </Head>
  )
}

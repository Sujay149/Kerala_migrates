import type { Metadata } from "next";
import React from "react";
import { SmoothNavigator, GlobalSkeletonLoader } from "../components/SmoothNavigator";
import { LoadingProvider } from "@/components/LoadingContext";
import Head from "next/head";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary, AsyncErrorBoundary } from "@/components/ErrorBoundary";
import { ConnectionStatus } from "@/hooks/useNetworkStatus";
import { NavigationProgressBar } from "@/components/OptimizedNavigation";
import Chatbot from "@/components/chatbot/Chatbot";



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://safeentry.app'),
  title: {
    default: 'SafeKerala - Kerala Digital Health Records',
    template: '%s | SafeKerala'
  },
  description: 'Transform your healthcare with SafeKerala - Kerala Government\'s digital companion for health record management, document submissions, and personalized health insights. Join citizens trusting SafeKerala for better health outcomes.',
  keywords: [
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
    'medication adherence',
    'health technology',
    'digital health',
    'telemedicine',
    'healthcare automation'
  ],
  authors: [{ name: 'Sujay Babu Thota', url: 'https://safeentry.app' }],
  creator: 'Kerala Governamnet - Sujay Babu Thota',
  publisher: 'Kerala Governamnet',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://safeentry.app',
    title: 'SafeEntry - Secure Digital Health Records for Migrant Workers',
    description: 'Transform your healthcare with SafeEntry - Your digital companion for health record management, document submissions, and personalized health insights.',
    siteName: 'SafeEntry',
    images: [
      {
        url: '/main.png',
        width: 1200,
        height: 630,
        alt: 'SafeEntry - Digital Health Records Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SafeEntry - Secure Digital Health Records for Migrant Workers',
    description: 'Transform your healthcare with SafeEntry - Your digital companion for health record management, document submissions, and personalized health insights.',
    creator: '@safeentry',
    images: ['/main.png'],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/kerala-digital-health-logo.svg",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  applicationName: "SafeKerala Digital Health",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SafeKerala",
  },
  alternates: {
    canonical: 'https://safekerala.kerala.gov.in',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'SafeKerala',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#0E7490',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  themeColor: '#0E7490',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GA_MEASUREMENT_ID');
            `,
          }}
        />
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "SafeKerala - Kerala Digital Health Records",
              "alternateName": "Government of Kerala Digital Health Initiative",
              "url": "https://safeentry.app",
              "logo": "https://safeentry.app/kerala-digital-health-logo.svg",
              "description": "Kerala Government's secure digital health records management system for citizens and healthcare providers",
              "founder": {
                "@type": "Organization",
                "name": "Government of Kerala"
              },
              "foundingDate": "2024",
              "sameAs": [
                "https://twitter.com/safeentry",
                "https://facebook.com/safeentry"
              ]
            })
          }}
        />
        
        {/* Structured Data for WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "SafeKerala",
              "url": "https://safekerala.kerala.gov.in",
              "description": "AI-powered health assistant for medication management and personalized health insights",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://safekerala.kerala.gov.in/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        
        {/* Structured Data for SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SafeKerala",
              "operatingSystem": "Android, iOS, Web",
              "applicationCategory": "HealthApplication",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "23"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              },
              "description": "AI-powered health assistant for medication management, prescription analysis, and personalized health insights",
              "downloadUrl": "https://safekerala.kerala.gov.in/safekerala.apk",
              "screenshot": "https://MigrantBot-ai.com/main.png"
            })
          }}
        />
      </Head>
  <body suppressHydrationWarning className={`${inter.className} bg-background text-foreground min-h-screen fade-in`} style={{ zIndex: 0 }}>
  <ErrorBoundary>
    <AsyncErrorBoundary>
      <ConnectionStatus />
      <NavigationProgressBar />
      <LoadingProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothNavigator>
            <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><GlobalSkeletonLoader /></div>}>
              {children}
            </React.Suspense>
          </SmoothNavigator>
          <Toaster position="top-right" />
          <Chatbot />
        </ThemeProvider>
      </LoadingProvider>
    </AsyncErrorBoundary>
  </ErrorBoundary>
  </body>
    </html>
  );
}
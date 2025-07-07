import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  type?: 'question' | 'category' | 'exam' | 'subject' | 'homepage';
  structuredData?: any[];
  openGraph?: {
    title?: string;
    description?: string;
    type?: string;
    image?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
}

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
    url: string;
    image?: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image?: string;
  };
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  canonical,
  type = 'homepage',
  structuredData = [],
  openGraph,
  twitter
}: SEOHeadProps) {
  const [location] = useLocation();
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate dynamic SEO data if not provided
  useEffect(() => {
    const generateSEO = async () => {
      if (title && description) {
        // Use provided data
        const baseUrl = window.location.origin;
        const fullUrl = `${baseUrl}${location}`;
        
        setSeoData({
          title,
          description,
          keywords,
          canonical: canonical || fullUrl,
          openGraph: {
            title: openGraph?.title || title,
            description: openGraph?.description || description,
            type: openGraph?.type || 'website',
            url: fullUrl,
            image: openGraph?.image
          },
          twitter: {
            card: twitter?.card || 'summary_large_image',
            title: twitter?.title || title,
            description: twitter?.description || description,
            image: twitter?.image
          }
        });
        return;
      }

      // Generate dynamic SEO using AI
      setIsLoading(true);
      try {
        const response = await fetch('/api/seo/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            title: title || document.title,
            description: description || '',
            url: location,
            content: ''
          })
        });

        if (response.ok) {
          const data = await response.json();
          setSeoData(data);
        }
      } catch (error) {
        console.error('SEO generation failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateSEO();
  }, [title, description, location, type, canonical, keywords, openGraph, twitter]);

  // Update document head
  useEffect(() => {
    if (!seoData) return;

    // Update title
    document.title = seoData.title;

    // Function to update or create meta tag
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Update meta tags
    updateMetaTag('description', seoData.description);
    updateMetaTag('keywords', seoData.keywords.join(', '));
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = seoData.canonical;

    // Update Open Graph tags
    updateMetaTag('og:title', seoData.openGraph.title, true);
    updateMetaTag('og:description', seoData.openGraph.description, true);
    updateMetaTag('og:type', seoData.openGraph.type, true);
    updateMetaTag('og:url', seoData.openGraph.url, true);
    updateMetaTag('og:site_name', 'Brainliest', true);
    
    if (seoData.openGraph.image) {
      updateMetaTag('og:image', seoData.openGraph.image, true);
      updateMetaTag('og:image:alt', seoData.openGraph.title, true);
    }

    // Update Twitter Card tags
    updateMetaTag('twitter:card', seoData.twitter.card);
    updateMetaTag('twitter:title', seoData.twitter.title);
    updateMetaTag('twitter:description', seoData.twitter.description);
    updateMetaTag('twitter:site', '@Brainliest');
    
    if (seoData.twitter.image) {
      updateMetaTag('twitter:image', seoData.twitter.image);
    }

    // Update robots and other SEO tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('author', 'Brainliest');
    updateMetaTag('publisher', 'Brainliest');
    updateMetaTag('application-name', 'Brainliest');
    updateMetaTag('theme-color', '#2563eb');

    // Update viewport if not set
    if (!document.querySelector('meta[name="viewport"]')) {
      updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    }

  }, [seoData]);

  // Render structured data
  useEffect(() => {
    if (structuredData.length === 0) return;

    // Remove existing structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add new structured data
    structuredData.forEach((data, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      script.id = `structured-data-${index}`;
      document.head.appendChild(script);
    });

    // Cleanup function
    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => script.remove());
    };
  }, [structuredData]);

  return null; // This component only manipulates the document head
}

// Hook for easy SEO management
export function useSEO({
  title,
  description,
  keywords,
  type,
  structuredData
}: {
  title?: string;
  description?: string;
  keywords?: string[];
  type?: 'question' | 'category' | 'exam' | 'subject' | 'homepage';
  structuredData?: any[];
}) {
  return {
    SEOHead: () => (
      <SEOHead
        title={title}
        description={description}
        keywords={keywords}
        type={type}
        structuredData={structuredData}
      />
    )
  };
}
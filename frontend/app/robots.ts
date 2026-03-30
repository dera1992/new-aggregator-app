import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/about', '/terms', '/privacy', '/cookies'],
        disallow: ['/api/', '/feed', '/compose', '/archive', '/saved', '/read', '/preferences', '/billing', '/settings', '/admin'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

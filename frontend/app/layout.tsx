import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';

import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: { default: 'Ubevera', template: '%s | Ubevera' },
  description: 'Real-time news intelligence for creators, journalists, and analysts.',
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Ubevera',
    title: 'Ubevera — Real-time News Intelligence',
    description: 'Track breaking stories, summarize instantly, publish faster.',
    url: siteUrl,
    locale: 'en_US',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Ubevera — Real-time News Intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ubevera — Real-time News Intelligence',
    description: 'Track breaking stories, summarize instantly, publish faster.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  try {
    const stored = localStorage.getItem('theme');
    const theme = stored || 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (_e) {
    document.documentElement.classList.add('dark');
  }
})();
`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Ubevera',
              url: siteUrl,
              logo: `${siteUrl}/android-chrome-512x512.png`,
              description: 'Real-time news intelligence for creators, journalists, and analysts.',
              sameAs: [],
            }),
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

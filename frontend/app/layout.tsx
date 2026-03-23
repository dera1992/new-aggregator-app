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

export const metadata: Metadata = {
  title: 'Ubevera',
  description: 'Real-time news intelligence for creators, journalists, and analysts.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

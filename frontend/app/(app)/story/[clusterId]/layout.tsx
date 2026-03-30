import type { Metadata } from 'next';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: { clusterId: string };
}): Promise<Metadata> {
  try {
    const res = await fetch(`${apiBase}/api/news/story/${params.clusterId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('not found');
    const data = await res.json();

    const title = data.story_title ?? 'Story';
    const description = data.summary
      ? String(data.summary).replace(/^[•\-\d.]\s*/gm, '').split('\n')[0].slice(0, 160)
      : 'Read the full story and multiple perspectives on Ubevera.';
    const url = `${siteUrl}/story/${params.clusterId}`;

    return {
      title,
      description,
      alternates: { canonical: `/story/${params.clusterId}` },
      openGraph: {
        type: 'article',
        title,
        description,
        url,
        siteName: 'Ubevera',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/og-image.png'],
      },
    };
  } catch {
    return {
      title: 'Story',
      description: 'Read the full story and multiple perspectives on Ubevera.',
    };
  }
}

export default async function StoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { clusterId: string };
}) {
  let jsonLd: object | null = null;
  try {
    const res = await fetch(`${apiBase}/api/news/story/${params.clusterId}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: data.story_title,
        description: data.summary
          ? String(data.summary).replace(/^[•\-\d.]\s*/gm, '').split('\n')[0].slice(0, 160)
          : '',
        url: `${siteUrl}/story/${params.clusterId}`,
        publisher: {
          '@type': 'Organization',
          name: 'Ubevera',
          url: siteUrl,
          logo: { '@type': 'ImageObject', url: `${siteUrl}/android-chrome-512x512.png` },
        },
        dateModified: new Date().toISOString(),
      };
    }
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}

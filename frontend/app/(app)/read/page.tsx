'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { fetchReadArticles } from '@/lib/api/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';

export default function ReadPage() {
  const readQuery = useQuery({
    queryKey: ['read'],
    queryFn: fetchReadArticles,
  });

  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle className="break-words">Read Articles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {readQuery.isLoading && <LoadingState label="Loading read history" />}
        {readQuery.error && (
          <ErrorState message={(readQuery.error as Error).message} />
        )}
        {readQuery.data && readQuery.data.articles.length === 0 && (
          <EmptyState message="No read history yet." />
        )}
        {readQuery.data && readQuery.data.articles.length > 0 && (
          <div className="space-y-3">
            {readQuery.data.articles.map((article, index) => (
              <div key={`${article.title}-${index}`} className="w-full min-w-0 rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-words font-semibold text-primary hover:underline"
                    >
                      {article.title}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {article.source} · {new Date(article.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {article.cluster_id && (
                    <Link
                      href={`/story/${article.cluster_id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View story
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

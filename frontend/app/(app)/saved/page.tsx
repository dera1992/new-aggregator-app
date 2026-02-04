'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { fetchSavedArticles } from '@/lib/api/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';

export default function SavedPage() {
  const savedQuery = useQuery({
    queryKey: ['saved'],
    queryFn: fetchSavedArticles,
  });

  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle className="break-words">Saved Articles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedQuery.isLoading && <LoadingState label="Loading saved articles" />}
        {savedQuery.error && (
          <ErrorState message={(savedQuery.error as Error).message} />
        )}
        {savedQuery.data && savedQuery.data.articles.length === 0 && (
          <EmptyState message="No saved articles yet." />
        )}
        {savedQuery.data && savedQuery.data.articles.length > 0 && (
          <div className="space-y-3">
            {savedQuery.data.articles.map((article, index) => (
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

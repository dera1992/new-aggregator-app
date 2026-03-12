'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { fetchReadArticles, unreadArticle, clearReadHistory } from '@/lib/api/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';

export default function ReadPage() {
  const queryClient = useQueryClient();

  const readQuery = useQuery({
    queryKey: ['read'],
    queryFn: fetchReadArticles,
  });

  const removeMutation = useMutation({
    mutationFn: (articleId: number) => unreadArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['read'] });
      toast.success('Removed from read history');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const clearMutation = useMutation({
    mutationFn: clearReadHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['read'] });
      toast.success('Read history cleared');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const articles = readQuery.data?.articles ?? [];

  return (
    <Card className="w-full min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="break-words">Read Articles</CardTitle>
        {articles.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {readQuery.isLoading && <LoadingState label="Loading read history" />}
        {readQuery.error && (
          <ErrorState message={(readQuery.error as Error).message} />
        )}
        {readQuery.data && articles.length === 0 && (
          <EmptyState message="No read history yet." />
        )}
        {articles.length > 0 && (
          <div className="space-y-3">
            {articles.map((article, index) => (
              <div key={`${article.title}-${index}`} className="w-full min-w-0 rounded-md border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
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
                  <div className="flex items-center gap-2 shrink-0">
                    {article.cluster_id && (
                      <Link
                        href={`/story/${article.cluster_id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View story
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => article.article_id && removeMutation.mutate(article.article_id)}
                      disabled={removeMutation.isPending}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove from history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

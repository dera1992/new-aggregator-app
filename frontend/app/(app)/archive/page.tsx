'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { fetchArchive, type ArchiveQuery } from '@/lib/api/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { PaginationControls } from '@/components/pagination-controls';

const defaultFilters: ArchiveQuery = {
  category: '',
  source: '',
  before: '',
  limit: 10,
  offset: 0,
};

export default function ArchivePage() {
  const [filters, setFilters] = useState<ArchiveQuery>(defaultFilters);

  const archiveQuery = useQuery({
    queryKey: ['archive', filters],
    queryFn: () => fetchArchive(filters),
  });

  const updateFilter = (key: keyof ArchiveQuery, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="break-words">Archive Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            className="w-full"
            placeholder="Category"
            value={filters.category}
            onChange={(event) => updateFilter('category', event.target.value)}
          />
          <Input
            className="w-full"
            placeholder="Source"
            value={filters.source}
            onChange={(event) => updateFilter('source', event.target.value)}
          />
          <Input
            className="w-full"
            placeholder="Before (ISO)"
            value={filters.before}
            onChange={(event) => updateFilter('before', event.target.value)}
          />
          <Input
            className="w-full"
            type="number"
            min={1}
            placeholder="Limit"
            value={filters.limit}
            onChange={(event) => updateFilter('limit', Number(event.target.value))}
          />
          <Input
            className="w-full"
            type="number"
            min={0}
            placeholder="Offset"
            value={filters.offset}
            onChange={(event) => updateFilter('offset', Number(event.target.value))}
          />
        </CardContent>
      </Card>

      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="break-words">Archived Articles</CardTitle>
        </CardHeader>
        <CardContent>
          {archiveQuery.isLoading && <LoadingState label="Loading archive" />}
          {archiveQuery.error && (
            <ErrorState message={(archiveQuery.error as Error).message} />
          )}
          {archiveQuery.data && archiveQuery.data.articles.length === 0 && (
            <EmptyState message="No archived articles found." />
          )}
          {archiveQuery.data && archiveQuery.data.articles.length > 0 && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="py-2">Title</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Source</th>
                      <th className="py-2">Timestamp</th>
                      <th className="py-2">Cluster</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveQuery.data.articles.map((article, index) => (
                      <tr key={`${article.title}-${index}`} className="border-b">
                        <td className="py-3 font-medium break-words">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {article.title}
                          </a>
                        </td>
                        <td className="py-3">{article.category}</td>
                        <td className="py-3">{article.source}</td>
                        <td className="py-3">
                          {new Date(article.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3">
                          {article.cluster_id ? (
                            <Link
                              href={`/story/${article.cluster_id}`}
                              className="text-primary hover:underline"
                            >
                              View story
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* TODO: API should return article_id to enable save/read actions. */}
              <PaginationControls
                limit={archiveQuery.data.limit}
                offset={archiveQuery.data.offset}
                total={archiveQuery.data.count}
                onPageChange={(nextOffset) => updateFilter('offset', nextOffset)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

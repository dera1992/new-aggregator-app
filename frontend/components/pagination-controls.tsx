'use client';

import { Button } from '@/components/ui/button';

export function PaginationControls({
  limit,
  offset,
  total,
  onPageChange,
}: {
  limit: number;
  offset: number;
  total: number;
  onPageChange: (nextOffset: number) => void;
}) {
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">
        Showing {Math.min(offset + 1, total)} -{' '}
        {Math.min(offset + limit, total)} of {total}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => onPageChange(Math.max(offset - limit, 0))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => onPageChange(offset + limit)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

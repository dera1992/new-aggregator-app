import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-48" />
      <span>{label}...</span>
    </div>
  );
}

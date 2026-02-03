import { Inbox } from 'lucide-react';

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
      <Inbox className="h-6 w-6" />
      <span>{message}</span>
    </div>
  );
}

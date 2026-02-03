import { AlertTriangle } from 'lucide-react';

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

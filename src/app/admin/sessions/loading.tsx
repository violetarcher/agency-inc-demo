import { TableSkeleton } from '@/components/loading';

export default function SessionsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-96 bg-muted rounded animate-pulse" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}
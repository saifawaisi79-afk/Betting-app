import { cn } from '../../lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl shimmer bg-[#10172a]/80',
        className
      )}
      {...props}
    />
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#0a0f1d] border border-white/[0.06] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="space-y-2 py-1">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl hidden sm:block" />
      </div>
    </div>
  );
}

export function OddsBoardSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-[#10172a] border border-white/[0.06] space-y-3"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

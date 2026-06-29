import { Skeleton } from '@/components/ui/skeleton'

/**
 * Generic full-page loading placeholder. Shown by the route guard while the
 * current user's permissions are being resolved, so we never flash a premature
 * "Access denied" (or content) before access control is decided.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

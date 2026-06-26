import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useAssetLocationsQuery } from '@/features/assets/assetQueries'
import { LocationForm } from '@/features/assets/components/LocationForm'

export const Route = createFileRoute('/_authenticated/dashboard/assets/locations/edit/$id/')({
  component: EditLocation,
})

function EditLocation() {
  const { id } = Route.useParams()
  const { data, isLoading } = useAssetLocationsQuery()

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  const initial = data.find((l) => String(l.id) === id)
  if (!initial) return <div className="p-6 text-center text-rose-500">Location not found.</div>
  return <LocationForm initial={initial} />
}

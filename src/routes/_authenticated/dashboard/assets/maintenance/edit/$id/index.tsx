import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useAssetMaintenanceQuery } from '@/features/assets/assetQueries'
import { MaintenanceForm } from '@/features/assets/components/MaintenanceForm'

export const Route = createFileRoute('/_authenticated/dashboard/assets/maintenance/edit/$id/')({
  component: EditMaintenance,
})

function EditMaintenance() {
  const { id } = Route.useParams()
  const { data, isLoading } = useAssetMaintenanceQuery()

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  const initial = data.find((m) => String(m.id) === id)
  if (!initial) return <div className="p-6 text-center text-rose-500">Record not found.</div>
  return <MaintenanceForm initial={initial} />
}

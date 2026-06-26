import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { assetService } from '@/features/assets/assetService'
import { AssetForm } from '@/features/assets/components/AssetForm'

export const Route = createFileRoute('/_authenticated/dashboard/assets/list/edit/$id/')({
  component: EditAsset,
})

function EditAsset() {
  const { id } = Route.useParams()
  const { data, isLoading } = useQuery({ queryKey: ['asset', id], queryFn: () => assetService.get(id) })

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading asset…
      </div>
    )
  }
  return <AssetForm initial={data} />
}

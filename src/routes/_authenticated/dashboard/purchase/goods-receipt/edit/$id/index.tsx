import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { purchaseService } from '@/features/purchase/purchaseService'
import { GrnForm } from '@/features/purchase/components/GrnForm'

export const Route = createFileRoute('/_authenticated/dashboard/purchase/goods-receipt/edit/$id/')({
  component: EditReceipt,
})

function EditReceipt() {
  const { id } = Route.useParams()
  const { data, isLoading } = useQuery({ queryKey: ['purchase-receipt', id], queryFn: () => purchaseService.getReceipt(id) })

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  return <GrnForm initial={data} />
}

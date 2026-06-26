import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { purchaseService } from '@/features/purchase/purchaseService'
import { RequestForm } from '@/features/purchase/components/RequestForm'

export const Route = createFileRoute('/_authenticated/dashboard/purchase/requests/edit/$id/')({
  component: EditRequest,
})

function EditRequest() {
  const { id } = Route.useParams()
  const { data, isLoading } = useQuery({ queryKey: ['purchase-request', id], queryFn: () => purchaseService.getRequest(id) })

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  return <RequestForm initial={data} />
}

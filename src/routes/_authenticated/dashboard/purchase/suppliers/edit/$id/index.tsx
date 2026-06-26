import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useSuppliersQuery } from '@/features/purchase/purchaseQueries'
import { SupplierForm } from '@/features/purchase/components/SupplierForm'

export const Route = createFileRoute('/_authenticated/dashboard/purchase/suppliers/edit/$id/')({
  component: EditSupplier,
})

function EditSupplier() {
  const { id } = Route.useParams()
  const { data, isLoading } = useSuppliersQuery()

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  const initial = data.find((s) => String(s.id) === id)
  if (!initial) return <div className="p-6 text-center text-rose-500">Supplier not found.</div>
  return <SupplierForm initial={initial} />
}

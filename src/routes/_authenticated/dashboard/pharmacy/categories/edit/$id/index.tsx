import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { usePharmacyCategoriesQuery } from '@/features/pharmacy/pharmacyQueries'
import { CategoryForm } from '@/features/pharmacy/components/CategoryForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/categories/edit/$id/')({
  component: EditCategory,
})

function EditCategory() {
  const { id } = Route.useParams()
  const { data, isLoading } = usePharmacyCategoriesQuery()

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  const initial = data.find((c) => String(c.id) === id)
  if (!initial) return <div className="p-6 text-center text-rose-500">Category not found.</div>
  return <CategoryForm initial={initial} />
}

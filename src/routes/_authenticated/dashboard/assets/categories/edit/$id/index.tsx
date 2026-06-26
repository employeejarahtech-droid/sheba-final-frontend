import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useAssetCategoriesQuery } from '@/features/assets/assetQueries'
import { CategoryForm } from '@/features/assets/components/CategoryForm'

export const Route = createFileRoute('/_authenticated/dashboard/assets/categories/edit/$id/')({
  component: EditCategory,
})

function EditCategory() {
  const { id } = Route.useParams()
  const { data, isLoading } = useAssetCategoriesQuery()

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

import { createFileRoute } from '@tanstack/react-router'
import { CategoryForm } from '@/features/pharmacy/components/CategoryForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/categories/create/')({
  component: () => <CategoryForm />,
})

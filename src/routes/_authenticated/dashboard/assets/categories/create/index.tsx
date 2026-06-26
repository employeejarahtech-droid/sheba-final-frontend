import { createFileRoute } from '@tanstack/react-router'
import { CategoryForm } from '@/features/assets/components/CategoryForm'

export const Route = createFileRoute('/_authenticated/dashboard/assets/categories/create/')({
  component: () => <CategoryForm />,
})

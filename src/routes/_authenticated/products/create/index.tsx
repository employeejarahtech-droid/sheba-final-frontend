import { createFileRoute } from '@tanstack/react-router'
import AddProductForm from '@/features/products/components/AddProductForm'

export const Route = createFileRoute('/_authenticated/products/create/')({
  component: AddProductForm,
})

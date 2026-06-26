import { createFileRoute } from '@tanstack/react-router'
import { SupplierForm } from '@/features/purchase/components/SupplierForm'

export const Route = createFileRoute('/_authenticated/dashboard/purchase/suppliers/create/')({
  component: () => <SupplierForm />,
})

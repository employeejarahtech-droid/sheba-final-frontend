import { createFileRoute } from '@tanstack/react-router'
import { SupplierForm } from '@/features/pharmacy/components/SupplierForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/suppliers/create/')({
  component: () => <SupplierForm />,
})

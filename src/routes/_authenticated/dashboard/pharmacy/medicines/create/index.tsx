import { createFileRoute } from '@tanstack/react-router'
import { MedicineForm } from '@/features/pharmacy/components/MedicineForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/medicines/create/')({
  component: () => <MedicineForm />,
})

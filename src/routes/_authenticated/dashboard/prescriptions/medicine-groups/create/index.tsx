import { createFileRoute } from '@tanstack/react-router'
import { MedicineGroupForm } from '@/features/prescriptions/components/MedicineGroupForm'

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/medicine-groups/create/')({
  component: () => <MedicineGroupForm />,
})

import { createFileRoute } from '@tanstack/react-router'
import { RxMedicineForm } from '@/features/prescriptions/components/RxMedicineForm'

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/medicines/create/')({
  component: () => <RxMedicineForm />,
})

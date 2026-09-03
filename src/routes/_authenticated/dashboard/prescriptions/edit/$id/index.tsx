import { createFileRoute } from '@tanstack/react-router'
import { PrescriptionForm } from '@/features/prescriptions/components/PrescriptionForm'

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/edit/$id/')({
  component: EditPrescription,
})

function EditPrescription() {
  const { id } = Route.useParams()
  return <PrescriptionForm prescriptionId={id} />
}

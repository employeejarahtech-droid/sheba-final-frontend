import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { usePatientQuery } from '@/features/prescriptions/patientsQueries'
import { PatientForm } from '@/features/prescriptions/components/PatientForm'

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/patients/edit/$id/')({
  component: EditPatient,
})

function EditPatient() {
  const { id } = Route.useParams()
  const { data, isLoading } = usePatientQuery(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  if (!data) return <div className="p-6 text-center text-rose-500">Patient not found.</div>
  return <PatientForm initial={data} />
}

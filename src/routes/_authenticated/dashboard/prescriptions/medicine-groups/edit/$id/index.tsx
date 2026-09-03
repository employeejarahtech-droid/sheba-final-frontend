import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useMedicineGroupQuery } from '@/features/prescriptions/rxMedicinesQueries'
import { MedicineGroupForm } from '@/features/prescriptions/components/MedicineGroupForm'

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/medicine-groups/edit/$id/')({
  component: EditMedicineGroup,
})

function EditMedicineGroup() {
  const { id } = Route.useParams()
  const { data, isLoading } = useMedicineGroupQuery(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  if (!data) return <div className="p-6 text-center text-rose-500">Medicine group not found.</div>
  return <MedicineGroupForm initial={data} />
}

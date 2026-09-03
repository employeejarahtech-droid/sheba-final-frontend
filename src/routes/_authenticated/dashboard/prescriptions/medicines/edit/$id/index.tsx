import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useRxMedicineQuery } from '@/features/prescriptions/rxMedicinesQueries'
import { RxMedicineForm } from '@/features/prescriptions/components/RxMedicineForm'

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/medicines/edit/$id/')({
  component: EditRxMedicine,
})

function EditRxMedicine() {
  const { id } = Route.useParams()
  const { data, isLoading } = useRxMedicineQuery(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  if (!data) return <div className="p-6 text-center text-rose-500">Medicine not found.</div>
  return <RxMedicineForm initial={data} />
}

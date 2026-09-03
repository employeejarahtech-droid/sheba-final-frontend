import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { pharmacyService } from '@/features/pharmacy/pharmacyService'
import { MedicineForm } from '@/features/pharmacy/components/MedicineForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/medicines/edit/$id/')({
  component: EditMedicine,
})

function EditMedicine() {
  const { id } = Route.useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['pharmacy', 'medicine', id],
    queryFn: () => pharmacyService.getMedicine(id),
  })

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  return <MedicineForm initial={data} />
}

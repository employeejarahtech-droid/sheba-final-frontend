import Doctors from '@/features/doctors'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outdoor/master/doctors/')({
  component: Doctors,
})


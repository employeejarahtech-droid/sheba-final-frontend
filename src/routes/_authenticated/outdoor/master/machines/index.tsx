import Machines from '@/features/machines'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outdoor/master/machines/')({
  component: Machines,
})

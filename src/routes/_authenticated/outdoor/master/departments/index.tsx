import Departments from '@/features/departments'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outdoor/master/departments/')({
  component: Departments,
})


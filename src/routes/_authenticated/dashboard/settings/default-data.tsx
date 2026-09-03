import { createFileRoute } from '@tanstack/react-router'
import { DefaultData } from '@/features/settings/default-data'

export const Route = createFileRoute('/_authenticated/dashboard/settings/default-data')({
  component: DefaultData,
})

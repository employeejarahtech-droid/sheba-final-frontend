import { createFileRoute } from '@tanstack/react-router'
import { RequestForm } from '@/features/purchase/components/RequestForm'

export const Route = createFileRoute('/_authenticated/dashboard/purchase/requests/create/')({
  component: () => <RequestForm />,
})

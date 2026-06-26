import { createFileRoute } from '@tanstack/react-router'
import { AssetForm } from '@/features/assets/components/AssetForm'

export const Route = createFileRoute('/_authenticated/dashboard/assets/list/create/')({
  component: () => <AssetForm />,
})

import { createFileRoute } from '@tanstack/react-router'
import { AppInventoryPage } from '@/features/settings/app-inventory'

export const Route = createFileRoute('/_authenticated/dashboard/settings/app-inventory')({
    component: AppInventoryPage,
})

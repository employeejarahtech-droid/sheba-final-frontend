import { createFileRoute } from '@tanstack/react-router'
import { InventoryAccountSettings } from '@/features/settings/inventory-accounts'

export const Route = createFileRoute('/_authenticated/dashboard/settings/inventory-accounts')({
    component: InventoryAccountSettings,
})

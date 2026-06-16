import { createFileRoute } from '@tanstack/react-router'
import { SettingsPrefix } from '@/features/settings/prefix'

export const Route = createFileRoute('/_authenticated/dashboard/settings/prefix')({
    component: SettingsPrefix,
})

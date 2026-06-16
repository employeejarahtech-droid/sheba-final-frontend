import { createFileRoute } from '@tanstack/react-router'
import { SettingsDateControls } from '@/features/settings/date-controls'

export const Route = createFileRoute('/_authenticated/dashboard/settings/date-controls')({
    component: SettingsDateControls,
})

import { createFileRoute } from '@tanstack/react-router'
import ReportSettings from '@/features/settings/report-settings'

export const Route = createFileRoute(
    '/_authenticated/dashboard/settings/report-settings/',
)({
    component: ReportSettings,
})

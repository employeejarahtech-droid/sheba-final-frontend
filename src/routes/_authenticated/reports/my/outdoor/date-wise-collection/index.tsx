import ReportsMyOutdoorDateWiseCollection from '@/features/reports-my-outdoor-date-wise-collection'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/reports/my/outdoor/date-wise-collection/')({
  component: ReportsMyOutdoorDateWiseCollection,
})

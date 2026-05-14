import ReportsMyOutdoorTodayCollection from '@/features/reports-my-outdoor-today-collection'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/reports/my/outdoor/today-collection/')({
  component: ReportsMyOutdoorTodayCollection,
})

import ResetDatabase from '@/features/reset-database/index'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard/reset-database/')({
    component: ResetDatabase,
})

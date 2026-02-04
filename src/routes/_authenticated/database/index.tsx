import DatabaseBrowser from '@/features/database/index'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/database/')({
    component: DatabaseBrowser,
})

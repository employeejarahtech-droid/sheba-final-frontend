import Help from '@/features/help/Help'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/help/')({
    component: Help,
})


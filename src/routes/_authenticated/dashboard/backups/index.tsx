import BackupsList from '@/features/backups/index'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard/backups/')({
    component: BackupsList,
})

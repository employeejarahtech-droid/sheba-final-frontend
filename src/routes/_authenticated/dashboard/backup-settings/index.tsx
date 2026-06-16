import BackupSettings from '@/features/backup-settings/index'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard/backup-settings/')({
    component: BackupSettings,
})

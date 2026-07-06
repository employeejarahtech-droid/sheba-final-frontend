import { createFileRoute } from '@tanstack/react-router'
import { SettingsDomainConfiguration } from '@/features/settings/domain-configuration'

export const Route = createFileRoute('/_authenticated/dashboard/settings/domain-configuration')({
    component: SettingsDomainConfiguration,
})

import { createFileRoute } from '@tanstack/react-router'
import { SettingsDomainConfiguration } from '@/features/settings/domain-configuration'

export const Route = createFileRoute('/_authenticated/dashboard/settings/domain-configuration')({
  component: DomainConfiguration,
})

function DomainConfiguration() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Domain Configuration
        </h1>
        <p className="text-muted-foreground">
          Add custom domains, verify DNS ownership, and manage SSL certificates
        </p>
      </div>
      <SettingsDomainConfiguration />
    </div>
  )
}

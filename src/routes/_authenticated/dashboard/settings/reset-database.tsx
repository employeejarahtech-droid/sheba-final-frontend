import { createFileRoute } from '@tanstack/react-router'
import { ResetDatabaseForm } from '@/features/settings/reset-database'

export const Route = createFileRoute('/_authenticated/dashboard/settings/reset-database')({
  component: ResetDatabase,
})

function ResetDatabase() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          Reset Database
        </h1>
        <p className="text-muted-foreground">
          Clear all transactional data while keeping master configuration data
        </p>
      </div>
      <ResetDatabaseForm />
    </div>
  )
}

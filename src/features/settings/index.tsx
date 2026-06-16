import { SettingsProfile } from './profile'

export function Settings() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Company Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your company settings and preferences
        </p>
      </div>
      <SettingsProfile />
    </div>
  )
}

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { SettingsProfile } from './profile'

export function Settings() {
  return (
    <>
      <AppHeader fixed />
      <Main className="p-6 lg:p-10 w-full flex-1 bg-gray-50/50 dark:bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Company Settings
            </h1>
            <p className="text-muted-foreground ">
              Manage your company settings and preferences
            </p>
          </div>
          <SettingsProfile />
        </div>
      </Main>
    </>
  )
}

import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/dashboard/settings')({
  component: SettingsLayout,
})

function SettingsLayout() {
  return (
    <>
      <AppHeader fixed />
      <Main className=" w-full flex-1 dark:bg-black/20">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </Main>
    </>
  )
}

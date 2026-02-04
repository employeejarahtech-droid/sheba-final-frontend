import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { topNav } from '@/data/data'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/outdoor/reception/patients/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <>
    <Header>
      <TopNav links={topNav} />
      <div className='ms-auto flex items-center space-x-4'>
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </div>
    </Header>
    <Main>
      <div className="mb-4">
        <h1 className='text-2xl font-bold tracking-tight'>List of Patients</h1>
      </div>
    </Main>
  </>
}

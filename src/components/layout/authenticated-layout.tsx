import { Outlet, Link } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { CurrencyProvider } from '@/components/currency-provider'
import { NotificationDropdown } from '@/components/notification-dropdown'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { useAuthStore } from '@/stores/auth-store'
import { getSubdomainInfo } from '@/lib/subdomain'

function LayoutHeader() {
  const user = useAuthStore((state) => state.user)
  const company = useAuthStore((state) => state.company)
  const subdomainInfo = getSubdomainInfo()
  const isCompanyPortal = subdomainInfo.isCompanyPortal

  return (
    <header className="flex h-14 shrink-0 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 bg-background print:hidden">
      <div className="flex items-center gap-2 px-4 w-full">
        <SidebarTrigger className="-ml-1 cursor-pointer" />

        {isCompanyPortal && company?.name && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950 rounded-full border border-blue-200 dark:border-blue-800">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {company.name}
            </span>
          </div>
        )}

        <Search className="hidden md:flex" />

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <span className="text-xs bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full text-blue-600 dark:text-blue-300 font-semibold hidden sm:block">
            {user?.userType === 'company_admin'
              ? 'Admin'
              : user?.userType === 'platform_admin'
                ? 'Super Admin'
                : user?.userType === 'staff'
                  ? 'Staff'
                  : 'User'}
          </span>
          <NotificationDropdown />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <CurrencyProvider>
      <SearchProvider>
        <LayoutProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <SkipToMain />
            <AppSidebar />
            <SidebarInset className="overflow-y-auto overflow-x-hidden flex flex-col h-svh rounded-none m-0 shadow-none print:h-auto print:overflow-visible">
              <LayoutHeader />
              <main className="anim-zoom-in p-4 lg:p-4 w-full flex-1">
                {children ?? <Outlet />}
              </main>
              <footer className="print:hidden">
                <div className="p-4 text-center text-sm text-muted-foreground flex flex-wrap items-center justify-center gap-3">
                  &copy; {new Date().getFullYear()}  HMS. All rights reserved.
                </div>
              </footer>
            </SidebarInset>
          </SidebarProvider>
        </LayoutProvider>
      </SearchProvider>
    </CurrencyProvider>
  )
}

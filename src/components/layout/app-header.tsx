import { NotificationDropdown } from '@/components/notification-dropdown'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from './header'
import { ReactNode } from 'react'

type AppHeaderProps = {
  fixed?: boolean
  showSearch?: boolean
  showNotifications?: boolean
  showThemeSwitch?: boolean
  showProfile?: boolean
  showConfigDrawer?: boolean
  className?: string
  children?: ReactNode
  rightSection?: ReactNode
}

export function AppHeader({
  fixed = true,
  showSearch = true,
  showNotifications = true,
  showThemeSwitch = true,
  showProfile = true,
  showConfigDrawer = false,
  className,
  children,
  rightSection,
}: AppHeaderProps) {
  return (
    <Header fixed={fixed} className={`${className} print:hidden`}>
      {children}
      {showSearch && <Search />}
      <div className="ms-auto flex items-center space-x-4">
        {showNotifications && <NotificationDropdown />}
        {showConfigDrawer && <ConfigDrawer />}
        {showThemeSwitch && <ThemeSwitch />}
        {showProfile && <ProfileDropdown />}
        {rightSection}
      </div>
    </Header>
  )
}

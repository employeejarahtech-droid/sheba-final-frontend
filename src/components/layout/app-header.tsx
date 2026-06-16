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

// Header is now rendered by AuthenticatedLayout.
// Kept as a no-op passthrough so existing page references don't break.
export function AppHeader(_props: AppHeaderProps) {
  return null
}

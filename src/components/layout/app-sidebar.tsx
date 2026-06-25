import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { useQuery } from '@tanstack/react-query'
import { NavGroup } from './nav-group'
import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { useAuthStore } from '@/stores/auth-store'
import { getCookie } from '@/lib/cookies'

export function AppSidebar() {
  const user = useAuthStore((s) => s.user)
  const token = getCookie('accessToken')

  // Fetch the flag live — the cached user object (from an older session/cookie)
  // may predate this field, so we don't rely on it alone.
  const { data: meData } = useQuery({
    queryKey: ['auth-me-hide-subscription'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json()
    },
    enabled: !!token,
    staleTime: 60_000,
  })

  const liveHide = meData?.data?.hide_subscription_info
  const hideSubscription =
    liveHide !== undefined
      ? !!liveHide
      : !!user?.hide_subscription_info

  // When the company has hide_subscription_info enabled, drop the
  // Subscription link from the sidebar entirely.
  const navGroups = hideSubscription
    ? sidebarData.navGroups.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => item.url !== '/dashboard/subscription'
        ),
      }))
    : sidebarData.navGroups

  return (
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader className="border-b py-[3.5px]">
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

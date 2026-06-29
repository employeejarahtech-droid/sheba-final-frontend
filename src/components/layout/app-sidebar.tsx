import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { NavGroup } from './nav-group'
import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { useLiveUser } from '@/hooks/use-live-user'
import { filterNavGroups } from '@/lib/permissions'

export function AppSidebar() {
  // Effective user reflects the role's CURRENT permissions (live /auth/me),
  // not a potentially stale cached cookie user. See use-live-user.
  const { user, storeUser, liveHide } = useLiveUser()

  const hideSubscription =
    liveHide !== undefined ? !!liveHide : !!storeUser?.hide_subscription_info

  // When the company has hide_subscription_info enabled, drop the
  // Subscription link from the sidebar entirely.
  const baseGroups = hideSubscription
    ? sidebarData.navGroups.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => item.url !== '/dashboard/subscription'
        ),
      }))
    : sidebarData.navGroups

  // Role-based gating: hide pages the user's role can't view. Admins and
  // roles with no permissions configured see everything (see lib/permissions).
  const navGroups = filterNavGroups(user, baseGroups)

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

/**
 * Admin Sidebar — Platform admin navigation
 *
 * Ported from the reference admin layout: branded purple header,
 * grouped navigation, and a footer account dropdown
 * (Profile / Settings / Logout). Uses the inset variant.
 */

import { Link } from '@tanstack/react-router'
import { Zap, UserCircle, Settings, LogOut } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { adminSidebarData } from './admin-sidebar-data'
import { NavGroup } from '@/components/layout/nav-group'
import { usePlatformAuthStore } from '@/stores/platform-auth-store'
import { useAdminProfile } from '@/hooks/usePlatformAdmin'

export function AdminSidebar() {
  const { data: profile } = useAdminProfile()
  const logout = usePlatformAuthStore((s) => s.logout)

  const name = profile?.name || 'Admin'
  const email = profile?.email || ''
  const initial = name.charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    window.location.href = '/admin/login'
  }

  return (
    <Sidebar variant="inset" collapsible="icon" className="print:hidden">
      {/* Brand header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-purple-600 text-white">
                  <Zap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">HMS</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Platform Admin
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        {adminSidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>

      {/* Account footer dropdown */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                    {initial}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 w-[--radix-dropdown-menu-trigger-width]"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="flex items-center gap-2 p-2 font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

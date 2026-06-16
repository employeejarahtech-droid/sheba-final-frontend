/**
 * Admin Sidebar — Platform admin navigation sidebar
 *
 * Mirrors src/components/layout/app-sidebar.tsx pattern
 * but uses adminSidebarData instead of tenant sidebarData.
 */

import { Hospital } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { adminSidebarData } from './admin-sidebar-data'
import { NavGroup } from '@/components/layout/nav-group'

export function AdminSidebar() {
  return (
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Hospital className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Platform Admin</span>
            <span className="text-xs text-muted-foreground"> HMS</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {adminSidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

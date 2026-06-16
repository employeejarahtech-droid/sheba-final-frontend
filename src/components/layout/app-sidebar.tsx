import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { NavGroup } from './nav-group'
import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader className="border-b py-[3.5px]">
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

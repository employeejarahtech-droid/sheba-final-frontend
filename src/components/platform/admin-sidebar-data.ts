/**
 * Admin Sidebar Data — Navigation items for the platform admin panel
 *
 * Follows the SidebarData type from src/components/layout/types.ts
 */

import {
  LayoutDashboard,
  Building2,
  CreditCard,
  UserPlus,
  Shield,
  Settings,
  Blocks,
  Receipt,
} from 'lucide-react'
import type { SidebarData } from '@/components/layout/types'

export const adminSidebarData: SidebarData = {
  teams: [],
  navGroups: [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/admin',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          title: 'Companies',
          url: '/admin/companies',
          icon: Building2,
        },
        {
          title: 'Plans',
          url: '/admin/plans',
          icon: CreditCard,
        },
        {
          title: 'Registrations',
          url: '/admin/registrations',
          icon: UserPlus,
        },
        {
          title: 'Admins',
          url: '/admin/admins',
          icon: Shield,
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          title: 'Settings',
          url: '/admin/settings',
          icon: Settings,
        },
        {
          title: 'Modules',
          url: '/admin/modules',
          icon: Blocks,
        },
        {
          title: 'Billing',
          url: '/admin/billing',
          icon: Receipt,
        },
      ],
    },
  ],
}

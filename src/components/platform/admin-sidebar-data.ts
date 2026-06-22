/**
 * Admin Sidebar Data — Navigation items for the platform admin panel
 *
 * Grouped layout ported from the reference admin panel:
 *  Overview · Platform Management · Finance · Communication · System
 *
 * Follows the SidebarData type from src/components/layout/types.ts
 */

import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Receipt,
  Puzzle,
  Package,
  ClipboardList,
  Mail,
  Settings,
  UserCircle,
} from 'lucide-react'
import type { SidebarData } from '@/components/layout/types'

export const adminSidebarData: SidebarData = {
  teams: [],
  navGroups: [
    {
      title: 'Overview',
      items: [
        { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Platform Management',
      items: [
        { title: 'Companies', url: '/admin/companies', icon: Building2 },
        { title: 'Admins', url: '/admin/admins', icon: Users },
        { title: 'Plans', url: '/admin/plans', icon: CreditCard },
        { title: 'Subscriptions', url: '/admin/subscriptions', icon: Receipt },
        { title: 'Modules', url: '/admin/modules', icon: Puzzle },
      ],
    },
    {
      title: 'Finance',
      items: [
        { title: 'Billing', url: '/admin/billing', icon: Package },
      ],
    },
    {
      title: 'Communication',
      items: [
        { title: 'Registrations', url: '/admin/registrations', icon: ClipboardList },
        { title: 'Contacts', url: '/admin/contacts', icon: Mail },
      ],
    },
    {
      title: 'System',
      items: [
        { title: 'Settings', url: '/admin/settings', icon: Settings },
        { title: 'Profile', url: '/admin/profile', icon: UserCircle },
      ],
    },
  ],
}

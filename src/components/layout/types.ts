import { type LinkProps } from '@tanstack/react-router'

// type User = {
//   name: string
//   email: string
//   avatar: string
// }

type Team = {
  name: string
  logo: React.ElementType
  plan: string
}

type BaseNavItem = {
  title: string
  badge?: string
  icon?: React.ElementType
  bold?: boolean
  // Search params to attach to `url` (e.g. { status: 'active' }) — kept
  // separate from `url` because TanStack Router's `Link` resolves `to` as a
  // pathname only; a `?query` string embedded directly in `url` does not get
  // parsed as search params (see nav-group.tsx Link usage).
  search?: Record<string, unknown>
}

type NavLink = BaseNavItem & {
  url: LinkProps['to'] | (string & {})
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] | (string & {}) })[]
  url?: never
}

// type NavItem = NavCollapsible | NavLink

type NavItem = BaseNavItem & {
  url?: LinkProps["to"] | (string & {});
  items?: NavItem[]; // recursion
};

type NavGroup = {
  title: string
  items: NavItem[]
}

type SidebarData = {
  teams: Team[]
  navGroups: NavGroup[]
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink }

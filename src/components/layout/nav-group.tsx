import { type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useState, useEffect } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { type NavItem, type NavGroup as NavGroupProps } from "./types";

/* -------------------------------------------
  NAV GROUP ROOT
-------------------------------------------- */
export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar();
  const href = useLocation({ select: (location) => location.href });

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-bold text-xs tracking-wider">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavItemRenderer
            key={item.title}
            item={item}
            href={href}
            isRoot
            isCollapsed={state === "collapsed" && !isMobile}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/* -------------------------------------------
  BADGE FOR ITEMS
-------------------------------------------- */
function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>;
}

/* -------------------------------------------
  REFRESH-ON-SAME-PAGE
  Clicking a sidebar link for the page you're already on does not remount the
  route, so React Query would keep showing cached data. When that happens,
  invalidate the query cache so any active (mounted) queries refetch — i.e.
  re-clicking a nav item refreshes its data. Only triggers on same-page
  re-navigation; navigating to a different page refetches on mount anyway.
-------------------------------------------- */
function refreshIfSamePage(queryClient: QueryClient, url: string | undefined, href: string) {
  if (!url) return;
  const currentPath = href.split('?')[0];
  if (currentPath === url) {
    queryClient.invalidateQueries();
  }
}

/* -------------------------------------------
  RECURSIVE ITEM RENDERER
-------------------------------------------- */
function NavItemRenderer({
  item,
  href,
  isRoot = false,
  isCollapsed = false,
}: {
  item: NavItem;
  href: string;
  isRoot?: boolean;
  isCollapsed?: boolean;
}) {
  if (!item.items || item.items.length === 0) {
    return <SidebarMenuSimpleLink item={item} href={href} />;
  }

  if (isRoot && isCollapsed) {
    return <SidebarMenuCollapsedDropdown item={item} href={href} />;
  }

  return <SidebarMenuRecursiveCollapsible item={item} href={href} />;
}

/* -------------------------------------------
  SIMPLE LINK
-------------------------------------------- */
function SidebarMenuSimpleLink({
  item,
  href,
}: {
  item: NavItem;
  href: string;
}) {
  const { setOpenMobile } = useSidebar();
  const queryClient = useQueryClient();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
      >
        <Link to={item.url!} search={item.search as any} onClick={() => { refreshIfSamePage(queryClient, item.url, href); setOpenMobile(false); }}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/* -------------------------------------------
  RECURSIVE COLLAPSIBLE (supports unlimited depth)
-------------------------------------------- */
function SidebarMenuRecursiveCollapsible({
  item,
  href,
  depth = 1,
}: {
  item: NavItem;
  href: string;
  depth?: number;
}) {
  const [open, setOpen] = useState(() => checkIsActive(href, item, true));

  // Auto-expand when navigating into a child item
  useEffect(() => {
    if (checkIsActive(href, item, true) && !open) {
      setOpen(true);
    }
  }, [href]);

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight
              className={`ms-auto transition-transform duration-200 ${
                open ? 'rotate-90' : 'rotate-0'
              }`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((child) => (
              <SidebarMenuSubItem key={child.title}>
                <NavItemRecursiveRenderer item={child} href={href} depth={depth + 1} />
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/* -------------------------------------------
  SUB MENU ITEM (recursive)
-------------------------------------------- */
function NavItemRecursiveRenderer({
  item,
  href,
  depth = 2,
}: {
  item: NavItem;
  href: string;
  depth?: number;
}) {
  const queryClient = useQueryClient();

  if (!item.items) {
    return (
      <SidebarMenuSubButton asChild isActive={checkIsActive(href, item)}>
        <Link to={item.url!} search={item.search as any} onClick={() => refreshIfSamePage(queryClient, item.url, href)}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuSubButton>
    );
  }

  return <SidebarMenuRecursiveCollapsible item={item} href={href} depth={depth} />;
}

/* -------------------------------------------
  COLLAPSED MODE (root level only)
-------------------------------------------- */
function SidebarMenuCollapsedDropdown({
  item,
  href,
}: {
  item: NavItem;
  href: string;
}) {
  const queryClient = useQueryClient();

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ms-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" sideOffset={4}>
          <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {item.items!.map((sub) => (
            <DropdownMenuItem
              key={`${sub.title}-${sub.url}`}
              asChild
              className={`${checkIsActive(href, sub) ? "bg-secondary" : ""}`}
            >
              <Link to={sub.url!} search={sub.search as any} onClick={() => refreshIfSamePage(queryClient, sub.url, href)}>
                {sub.icon && <sub.icon />}
                <span>{sub.title}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

/* -------------------------------------------
  ACTIVE STATE CHECK
-------------------------------------------- */
function checkIsActive(href: string, item: NavItem, mainNav = false) {
  // Items that pin specific search params (e.g. Tests (Active) -> ?status=active)
  // must also match those params, or every status variant of the same page
  // would highlight together.
  if (item.search && Object.keys(item.search).length > 0) {
    const [hrefPath, hrefQuery] = href.split("?");
    if (hrefPath !== item.url) return false;
    const params = new URLSearchParams(hrefQuery || "");
    return Object.entries(item.search).every(([k, v]) => params.get(k) === String(v));
  }

  return (
    href === item.url ||
    href.split("?")[0] === item.url ||
    item.items?.some((i) => i.url === href) ||
    (mainNav &&
      href.split("/")[1] !== "" &&
      href.split("/")[1] === item?.url?.split("/")[1])
  );
}

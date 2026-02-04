import { type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

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
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
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
  // Simple link (leaf)
  if (!item.items || item.items.length === 0) {
    return <SidebarMenuSimpleLink item={item} href={href} />;
  }

  // COLLAPSED → DROPDOWN for root-level only
  if (isRoot && isCollapsed) {
    return (
      <SidebarMenuCollapsedDropdown item={item} href={href} />
    );
  }

  // COLLAPSIBLE (normal nested open/close)
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

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
      >
        <Link to={item.url!} onClick={() => setOpenMobile(false)}>
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
import { useState } from 'react'

function SidebarMenuRecursiveCollapsible({
  item,
  href,
  depth = 1,
}: {
  item: NavItem
  href: string
  depth?: number
}) {
  
  // const { setOpenMobile } = useSidebar()
  const isDefaultOpen = checkIsActive(href, item, true)
  const [open, setOpen] = useState(isDefaultOpen) // track open state locally

  return (
    <Collapsible
      asChild
      defaultOpen={isDefaultOpen}
      onOpenChange={(state) => setOpen(state)}
      className="collapsible"
    >
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
  )
}

/* -------------------------------------------
  SUB MENU ITEM (recursive)
-------------------------------------------- */
function NavItemRecursiveRenderer({
  item,
  href,
  depth = 2,
}: {
  item: NavItem
  href: string
  depth?: number
}) {
  if (!item.items) {
    return (
      <SidebarMenuSubButton asChild isActive={checkIsActive(href, item)}>
        <Link to={item.url!}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuSubButton>
    )
  }

  return <SidebarMenuRecursiveCollapsible item={item} href={href} depth={depth} />
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
              <Link to={sub.url!}>
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
  return (
    href === item.url ||
    href.split("?")[0] === item.url ||
    item.items?.some((i) => i.url === href) ||
    (mainNav &&
      href.split("/")[1] !== "" &&
      href.split("/")[1] === item?.url?.split("/")[1])
  );
}

"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuButton,
} from "./ui/sidebar";
import { NavMain } from "./nav-main";
import { sidebarItemLink } from "@/config/sidebarItemLInk";
import { useGetSettingsInfoQuery } from "@/store/features/admin/settingsApiService";
import { Loader2 } from "lucide-react";

export function AppSidebar({ ...props }) {
  const { data: companyProfileSettings } = useGetSettingsInfoQuery();
  const logo = companyProfileSettings?.data?.logo_url;
  const companyName = companyProfileSettings?.data?.company_name;
  // Dummy team data
  const activeTeam = {
    name: companyName || "Inleads IT",
    plan: "Free",
    logo: () => (
      <div className="flex items-center justify-center">
        {logo ? (
          <img
            src={logo}
            alt={companyProfileSettings?.data?.company_name || "Logo"}
            className="w-12 h-12 object-contain rounded-full"
          />
        ) : (
          <div className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}
      </div>
    ),
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="text-sidebar-primary-foreground flex aspect-square justify-center rounded-lg">
            <activeTeam.logo />
          </div>
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate font-semibold">{activeTeam.name}</span>
            {/* <span className="truncate text-xs">{activeTeam.plan}</span> */}
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItemLink ?? []} />
      </SidebarContent>
    </Sidebar>
  );
}

"use client";

import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
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
} from "./ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import React, { type ReactNode } from "react";
import { useAppSelector } from "@/store/store";

// Type for sub-menu items
export interface NavSubItem {
  title: string;
  url: string;
  icon?: React.ElementType;
  allowedPermissions?: string[];
}

// Type for main menu items
export interface NavItem {
  title: string;
  url?: string;
  icon?: React.ElementType;
  items?: NavSubItem[];
  isActive?: boolean;
  layout?: ReactNode;
  allowedPermissions?: string[]
}

// Props type
interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };


  return (
    <SidebarGroup>
      <SidebarGroupLabel>General</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isHide = item.allowedPermissions && !item.allowedPermissions.some(p => userPermissions.includes(p))
          if (!item.title) return null; //  completely hide the item
          if (isHide) return null; //  completely hide the item
          const hasSubItems = Array.isArray(item.items) && item.items.length > 0;




          // Special logic: skip children if layout and url exist
          if (item.layout && item.url) {
            return (
              <SidebarMenuItem key={item.title} className="cursor-pointer">
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link to={item.url} onClick={handleLinkClick}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }


          // CASE 1: With sub-items -> collapsible
          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger className="cursor-pointer" asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items!.map((subItem) => {
                        const isHide = subItem.allowedPermissions && !subItem.allowedPermissions.some(p => userPermissions.includes(p));
                        if (!subItem.title) return null; //  completely hide the item
                        if (isHide) return null; //  completely hide the item
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link to={subItem.url} onClick={handleLinkClick}>
                                {subItem.icon && <subItem.icon />}
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          // CASE 2: No sub-items -> simple menu link
          return (
            <SidebarMenuItem key={item.title} className="cursor-pointer">
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link to={item.url!} onClick={handleLinkClick}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}



















// "use client";

// import { ChevronRight } from "lucide-react";
// import { Link } from "react-router";
// import {
//   SidebarGroup,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
// } from "./ui/sidebar";
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
// import React from "react";

// // Type for sub-menu items
// export interface NavSubItem {
//   title: string;
//   url: string;
//   icon?: React.ElementType;
// }

// // Type for main menu items
// export interface NavItem {
//   title: string;
//   url?: string;
//   icon?: React.ElementType;
//   items?: NavSubItem[];
//   isActive?: boolean;
// }

// // Props type
// interface NavMainProps {
//   items: NavItem[];
// }

// export function NavMain({ items }: NavMainProps) {
//   return (
//     <SidebarGroup>
//       <SidebarGroupLabel>General</SidebarGroupLabel>
//       <SidebarMenu>
//         {items.map((item) => {
//           const hasSubItems = Array.isArray(item.items) && item.items.length > 0;

//           // CASE 1: With sub-items -> collapsible
//           if (hasSubItems) {
//             return (
//               <Collapsible
//                 key={item.title}
//                 asChild
//                 defaultOpen={item.isActive}
//                 className="group/collapsible"
//               >
//                 <SidebarMenuItem>
//                   <CollapsibleTrigger className="cursor-pointer" asChild>
//                     <SidebarMenuButton tooltip={item.title}>
//                       {item.icon && <item.icon />}
//                       <span>{item.title}</span>
//                       <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
//                     </SidebarMenuButton>
//                   </CollapsibleTrigger>

//                   <CollapsibleContent>
//                     <SidebarMenuSub>
//                       {item.items!.map((subItem) => (
//                         <SidebarMenuSubItem key={subItem.title}>
//                           <SidebarMenuSubButton asChild>
//                             <Link to={subItem.url}>
//                               {subItem.icon && <subItem.icon />}
//                               <span>{subItem.title}</span>
//                             </Link>
//                           </SidebarMenuSubButton>
//                         </SidebarMenuSubItem>
//                       ))}
//                     </SidebarMenuSub>
//                   </CollapsibleContent>
//                 </SidebarMenuItem>
//               </Collapsible>
//             );
//           }

//           // CASE 2: No sub-items -> simple menu link
//           return (
//             <SidebarMenuItem key={item.title} className="cursor-pointer">
//               <SidebarMenuButton asChild tooltip={item.title}>
//                 <Link to={item.url!}>
//                   {item.icon && <item.icon />}
//                   <span>{item.title}</span>
//                 </Link>
//               </SidebarMenuButton>
//             </SidebarMenuItem>
//           );
//         })}
//       </SidebarMenu>
//     </SidebarGroup>
//   );
// }

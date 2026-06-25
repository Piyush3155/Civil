"use client"

import {  LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"


import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Adapted to support Grouped items as per existing app structure
export function NavMain({
  groups,
}: {
  groups: {
    title: string
    items: {
      title: string
      url: string
      icon: LucideIcon
      target?: string
      items?: { // Optional subitems if you have them in future
        title: string
        url: string
      }[]
    }[]
  }[]
}) {
  const router = useRouter()
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.title}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  tooltip={item.title} 
                  onClick={() => {
                    if (item.target === "_blank") {
                      window.open(item.url, "_blank");
                    } else {
                      router.push(item.url);
                    }
                  }}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}

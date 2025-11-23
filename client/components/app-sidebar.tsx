import * as React from "react"
import { 
  LayoutDashboard,
  Building2,
  Users,
  HardHat,
  FileText,
  Bell,
  Settings,
  GalleryVerticalEnd,
  Send
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Civil Construction Management Navigation
const data = {
  navMain: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Project Management",
      items: [
        {
          title: "Projects",
          url: "/projects",
          icon: Building2,
        },
        {
          title: "Drawings",
          url: "/drawings",
          icon: FileText,
        },
      ],
    },
    {
      title: "Team & Resources",
      items: [
        {
          title: "Contractors",
          url: "/contractors",
          icon: Users,
        },
        {
          title: "Labours",
          url: "/labours",
          icon: HardHat,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          title: "Notifications",
          url: "/notifications",
          icon: Bell,
        },
        {
          title: "Send FCM",
          url: "/send-fcm",
          icon: Send,
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <GalleryVerticalEnd className="size-5" />
          </div>
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-semibold text-lg">
            CIVIL DESK
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="flex items-center gap-2">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

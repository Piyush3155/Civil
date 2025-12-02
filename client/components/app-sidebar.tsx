import * as React from "react"
import Image from "next/image"
import { 
  LayoutDashboard,
  Building2,
  Users,
  HardHat,
  FileText,
  Bell,
  Settings,
  Send,
  BarChart3,
  UserCheck
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
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { getSession } from "@/lib/sessionAction"

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
        {
          title: "Analytics",
          url: "/analytics",
          icon: BarChart3,
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
        {
          title: "Users",
          url: "/users",
          icon: UserCheck,
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
  const [isLoading, setIsLoading] = React.useState(true);
  const [sessionData, setSessionData] = React.useState<{
    username: string;
    email: string;
    roles: string[];
  }>({
    username: "",
    email: "",
    roles: [],
  });

  React.useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession();
        if (session.isLoggedIn) {
          setSessionData({
            username: session.username || session.name || "Guest User",
            email: session.email || "",
            roles: session.roles || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPrimaryRole = () => {
    if (sessionData.roles.length === 0) return "User";
    return sessionData.roles[0].charAt(0) + sessionData.roles[0].slice(1).toLowerCase();
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-foreground shadow-lg overflow-hidden border border-border">
            <Image src="/ios/1024.png" alt="Logo" width={40} height={40} className="object-cover rounded-xl" />
          </div>
          <span className="bg-gradient-to-r from-yellow-400 to-primary/70 bg-clip-text text-transparent font-semibold text-lg">
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoading ? (
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 mx-2 mb-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 mx-2 mb-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm shadow-md">
                  {getInitials(sessionData.username)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-semibold text-sm truncate">
                    {sessionData.username || "Guest User"}
                  </span>
                  {sessionData.email && (
                    <span className="text-xs text-muted-foreground truncate">
                      {sessionData.email}
                    </span>
                  )}
                  {sessionData.roles.length > 0 && (
                    <span className="text-xs text-muted-foreground/80 mt-0.5">
                      {getPrimaryRole()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

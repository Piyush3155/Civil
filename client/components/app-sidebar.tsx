"use client"

import * as React from "react"
import Link from "next/link"
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
  UserCheck,
  Wrench,
  KeyRound,
  LucideIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { getSession } from "@/lib/sessionAction"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import Image from "next/image"

// Define role types
type UserRole = 'ADMIN' | 'USER' | 'PROJECT_MANAGER' | 'SITE_ENGINEER' | 'CONTRACTOR' | 'LABOUR' | 'CLIENT';

// Navigation item interface with role permissions
interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  allowedRoles: UserRole[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
  allowedRoles?: UserRole[]; // Optional - if set, entire group is restricted
}

// Civil Construction Management Navigation with Role-Based Access
const navigationData: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'LABOUR'],
      },
      {
        title: "Client Dashboard",
        url: "/client",
        icon: LayoutDashboard,
        allowedRoles: ['CLIENT'],
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
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'LABOUR', 'CLIENT'],
      },
      {
        title: "Drawings",
        url: "/drawings",
        icon: FileText,
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'LABOUR'],
      },
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CLIENT'],
      },
    ],
  },
  {
    title: "Team & Resources",
    allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR'],
    items: [
      {
        title: "Contractors",
        url: "/contractors",
        icon: Users,
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'],
      },
      {
        title: "Labours",
        url: "/labours",
        icon: HardHat,
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR'],
      },
      {
        title: "Equipment",
        url: "/equipment",
        icon: Wrench,
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'],
      },
      {
        title: "Users",
        url: "/users",
        icon: UserCheck,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  {
    title: "System",
    allowedRoles: ['ADMIN', 'PROJECT_MANAGER'],
    items: [
      {
        title: "Notifications",
        url: "/notifications",
        icon: Bell,
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'LABOUR', 'CLIENT'],
      },
      {
        title: "Password Requests",
        url: "/password-reset",
        icon: KeyRound,
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER'],
      },
      {
        title: "Send FCM",
        url: "/send-fcm",
        icon: Send,
        allowedRoles: ['ADMIN'],
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER'],
      },
    ],
  },
];

// Helper function to check if user has access to an item
const hasAccess = (userRoles: string[], allowedRoles: UserRole[]): boolean => {
  if (userRoles.includes('ADMIN')) return true;
  return userRoles.some(role => allowedRoles.includes(role as UserRole));
};

// Filter navigation based on user roles
const getFilteredNavigation = (userRoles: string[]): NavGroup[] => {
  return navigationData
    .map(group => {
      const filteredItems = group.items.filter(item => 
        hasAccess(userRoles, item.allowedRoles)
      );

      if (group.allowedRoles && !hasAccess(userRoles, group.allowedRoles)) {
        return null;
      }

      if (filteredItems.length === 0) return null;

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group): group is NavGroup => group !== null);
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [sessionData, setSessionData] = React.useState<{
    username: string;
    email: string;
    roles: string[];
    userId?: string;
  }>({
    username: "",
    email: "",
    roles: [],
    userId: undefined,
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
            userId: session.userId,
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

  const filteredNavigation = React.useMemo(
    () => getFilteredNavigation(sessionData.roles),
    [sessionData.roles]
  );

  const userData = {
    name: sessionData.username || "Guest User",
    email: sessionData.email || "",
    avatar: "", // Add avatar URL if available
    initials: getInitials(sessionData.username || "Guest User"),
  };

  return (
    <Sidebar collapsible="offcanvas" {...props} className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!py-6 !px-1.5 hover:bg-transparent"
            >
              <Link href="/dashboard" className="flex items-center gap-2 pb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Image
                    src="/ios/1024.png"
                    alt="Civil Desk"
                    width={36}
                    height={36}
                    className="object-cover w-full h-full rounded-lg"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-base font-bold tracking-tight text-sidebar-foreground">
                    CIVIL DESK
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Engineering Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {isLoading ? (
          <div className="space-y-6 px-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-20 rounded-md bg-sidebar-accent/50" />
                <div className="space-y-1">
                  <Skeleton className="h-9 w-full rounded-lg bg-sidebar-accent/30" />
                  <Skeleton className="h-9 w-full rounded-lg bg-sidebar-accent/30" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <NavMain groups={filteredNavigation} />
        )}
      </SidebarContent>

      <SidebarFooter>
        {!isLoading && <NavUser user={userData} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}


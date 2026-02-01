import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  LucideIcon,
  LogOut,
  User,
  ChevronUp
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { getSession, logout } from "@/lib/sessionAction"

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
// LABOUR role now has access to Projects (assigned projects only - filtered in dashboard/projects page)
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
        // Dedicated dashboard for clients to view project progress
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
        // Added LABOUR to see their assigned projects
        allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'LABOUR', 'CLIENT'],
      },
      {
        title: "Drawings",
        url: "/drawings",
        icon: FileText,
        // LABOUR can view drawings but not create/update (enforced on backend)
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
  // ADMIN has access to everything
  if (userRoles.includes('ADMIN')) return true;
  
  // Check if user has any of the allowed roles
  return userRoles.some(role => allowedRoles.includes(role as UserRole));
};

// Filter navigation based on user roles
const getFilteredNavigation = (userRoles: string[]): NavGroup[] => {
  return navigationData
    .map(group => {
      // Filter items within the group
      const filteredItems = group.items.filter(item => 
        hasAccess(userRoles, item.allowedRoles)
      );

      // If group has allowedRoles, check if user has access
      if (group.allowedRoles && !hasAccess(userRoles, group.allowedRoles)) {
        return null;
      }

      // Return group only if it has visible items
      if (filteredItems.length === 0) return null;

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group): group is NavGroup => group !== null);
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
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

  const getPrimaryRole = () => {
    if (sessionData.roles.length === 0) return "User";
    // Format role for display (e.g., PROJECT_MANAGER -> Project Manager)
    const role = sessionData.roles[0];
    return role
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getRoleBadgeColor = () => {
    const role = sessionData.roles[0];
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      case 'PROJECT_MANAGER':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'SITE_ENGINEER':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'CONTRACTOR':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      case 'LABOUR':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'CLIENT':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-status');
        localStorage.removeItem('user-info');
        localStorage.removeItem('accessToken');
      }
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get filtered navigation based on user roles
  const filteredNavigation = React.useMemo(
    () => getFilteredNavigation(sessionData.roles),
    [sessionData.roles]
  );

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-foreground shadow-lg overflow-hidden border border-border">
            <Image src="/ios/1024.png" alt="Logo" width={40} height={40} className="object-cover rounded-xl" />
          </div>
          <span className="bg-primary bg-clip-text text-transparent font-bold text-lg">
            CIVIL DESK
            <p className="text-xs font-thin text-foreground ">Construction Management</p>
          </span>
         
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          // Loading skeleton for navigation
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-1 pl-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Render filtered navigation based on user roles
          filteredNavigation.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url} className="flex items-center gap-2">
                          {item.icon && <item.icon className="h-4 w-4" />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 mx-2 mb-2 hover:bg-muted/60 transition-colors cursor-pointer text-left">
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
                        <span className={`text-xs mt-1 px-2 py-0.5 rounded-full w-fit ${getRoleBadgeColor()}`}>
                          {getPrimaryRole()}
                        </span>
                      )}
                    </div>
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  side="top" 
                  align="start"
                  className="w-56"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{sessionData.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {sessionData.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

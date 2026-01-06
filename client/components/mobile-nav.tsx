"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Building2, 
  Plus, 
  Bell, 
  Search,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

const navItems = [
  { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
  { icon: Building2, label: "Projects", href: "/projects" },
  { icon: Plus, label: "Add", href: "/projects/new", isAction: true },
  { icon: Bell, label: "Alerts", href: "/notifications" },
  { icon: Menu, label: "Menu", href: "#", isMenuTrigger: true },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-t md:hidden pb-safe">
      <div className="flex h-full items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          
          if (item.isAction) {
            return (
              <Link
                key="action"
                href={item.href}
                className="relative -mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl active:scale-95 hover:scale-105 transition-all duration-300 border-4 border-background group"
              >
                <item.icon className="h-7 w-7 stroke-[2.5px] transition-transform group-hover:rotate-90" />
              </Link>
            )
          }

          if (item.isMenuTrigger) {
            return (
              <button
                key="menu"
                onClick={() => setOpenMobile(true)}
                className="flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300 text-muted-foreground hover:text-primary active:scale-90"
              >
                <div className="p-1 rounded-xl transition-all duration-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold tracking-wide">
                  {item.label}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className={cn(
                "p-1 rounded-xl transition-all duration-300",
                isActive && "bg-primary/10 shadow-sm"
              )}>
                <item.icon className={cn(
                  "h-6 w-6 transition-transform duration-300",
                  isActive && "scale-110 stroke-[2.5px]"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-bold tracking-wide",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/analytics": "Analytics",
  "/contractors": "Contractors",
  "/labours": "Labours",
  "/equipment": "Equipment",
  "/users": "User Management",
  "/drawings": "Drawings",
  "/projects/new": "New Project",
  "/send-fcm": "Send FCM",
}

export function MobileTopNav() {
  const pathname = usePathname()
  
  // Find the matching title or use default
  const title = titles[pathname] || "CIVIL DESK"
  
  return (
    <header className="fixed top-0 left-0 right-0 z-[40] h-14 bg-background/80 backdrop-blur-xl border-b md:hidden flex items-center justify-between px-4">
       <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-foreground shadow-lg overflow-hidden border border-border">
          <Image src="/ios/1024.png" alt="Logo" width={40} height={40} className="object-cover rounded-xl" />
        </div>
                  <span className="bg-primary bg-clip-text text-transparent font-bold text-lg">
                    CIVIL DESK
                    <p className="text-xs font-thin text-foreground ">{title}</p>
                  </span>
                 
       </div>
       <div className="flex items-center gap-1">
         <Link href="/notifications">
           <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full h-9 w-9 relative">
             <Bell className="h-5 w-5" />
             <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-destructive rounded-full border border-background animate-pulse" />
           </Button>
         </Link>
         <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full h-9 w-9">
           <Search className="h-5 w-5" />
         </Button>
       </div>
    </header>
  )
}

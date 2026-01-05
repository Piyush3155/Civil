"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { MobileTopNav, MobileBottomNav } from "@/components/mobile-nav"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <MobileTopNav />
        <div className="flex flex-1 flex-col pb-20 md:pb-0 pt-14 md:pt-0">
          {children}
        </div>
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  )
}
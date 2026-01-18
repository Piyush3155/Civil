"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { MobileTopNav, MobileBottomNav } from "@/components/mobile-nav"
import { AiChatbot } from "@/components/ai/page"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import { useState } from "react"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAiOpen, setIsAiOpen] = useState(false)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <MobileTopNav />
        <div className="flex flex-1 flex-col pb-20 md:pb-0 pt-14 md:pt-0">
          {children}
        </div>
        <MobileBottomNav />

        {/* Floating AI Button */}
        <Button
          className="fixed bottom-20 right-4 md:bottom-4 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 z-50"
          size="icon"
          onClick={() => setIsAiOpen(!isAiOpen)}
        >
          <Bot className="h-6 w-6" />
        </Button>

        {/* AI Chat Window */}
        {isAiOpen && (
          <div className="fixed bottom-36 right-4 md:bottom-20 w-[calc(100%-2rem)] md:w-96 h-[70vh] md:h-[600px] bg-background border rounded-lg shadow-2xl z-50 overflow-hidden">
            <AiChatbot onClose={() => setIsAiOpen(false)} />
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
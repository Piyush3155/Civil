"use client";

import { AppSidebar } from "../../components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { sendTestFcm, storeFcmToken } from "../actions/user/main"
import { requestNotificationPermission } from "@/lib/firebase"
import { useState, useEffect } from "react"

export default function Page() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [firebaseConfigured, setFirebaseConfigured] = useState(false)

  useEffect(() => {
    // Check if Firebase is configured
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    setFirebaseConfigured(!!(apiKey && apiKey !== 'your-api-key'))
  }, [])

  const handleTestFcm = async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const result = await sendTestFcm()
      setMessage(result.message || 'Test notification sent!')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send test notification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestFcm = async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const token = await requestNotificationPermission()
      if (token) {
        await storeFcmToken(token)
        setMessage('FCM token stored successfully!')
      } else {
        setMessage('Failed to get FCM token. Check notification permissions and Firebase config.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to setup FCM')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Building Your Application
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">FCM Setup</h3>
                {!firebaseConfigured && (
                  <p className="text-sm text-orange-500 mb-2">
                    ⚠️ Firebase not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.
                  </p>
                )}
                <Button 
                  onClick={handleRequestFcm} 
                  disabled={isLoading || !firebaseConfigured}
                  variant="outline"
                  className="mb-2 mr-2"
                >
                  {isLoading ? 'Setting up...' : 'Setup FCM Token'}
                </Button>
                <Button 
                  onClick={handleTestFcm} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Test Notification'}
                </Button>
                {message && (
                  <p className={`text-sm mt-2 ${message.includes('Failed') || message.includes('No FCM') ? 'text-red-500' : 'text-green-500'}`}>
                    {message}
                  </p>
                )}
              </div>
            </div>
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

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
import { useState, useEffect } from "react"
import useFcmToken from "@/hooks/useFcmToken"
import { updateUserToken } from "@/app/actions/notification/main"

export default function Page() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [firebaseConfigured, setFirebaseConfigured] = useState(false)
  const { token, notificationPermissionStatus, requestPermission } = useFcmToken()

  useEffect(() => {
    // Check if Firebase is configured
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    setFirebaseConfigured(!!(apiKey && authDomain && projectId &&
      apiKey !== 'your-api-key' &&
      authDomain !== 'your-auth-domain' &&
      projectId !== 'your-project-id'))
  }, [])

  const handleRequestFcm = async () => {
    console.log("handleRequestFcm called");
    setIsLoading(true)
    setMessage(null)
    try {
      console.log("Calling requestPermission...");
      const fcmToken = await requestPermission()
      console.log("requestPermission returned token:", fcmToken);
      if (fcmToken) {
        // Get device info for token storage
        const deviceId = localStorage.getItem("fcm_device_id") || "web-device-" + Date.now()
        const deviceType = "WEB"
        console.log("Calling updateUserToken with:", { deviceId, deviceType });

        await updateUserToken(fcmToken, deviceId, deviceType)
        localStorage.setItem("fcm_device_id", deviceId)
        setMessage('FCM token stored successfully!')
      } else {
        setMessage('Failed to get FCM token. Check notification permissions.')
      }
    } catch (error) {
      console.error("Error in handleRequestFcm:", error);
      setMessage(error instanceof Error ? error.message : 'Failed to setup FCM')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestFcm = async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/fcm/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send test notification')
      }

      const result = await response.json()
      setMessage(result.message || 'Test notification sent!')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send test notification')
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
                <div className="mb-2">
                  <p className="text-sm text-gray-600">
                    Permission: <span className={`font-medium ${
                      notificationPermissionStatus === 'granted' ? 'text-green-600' :
                      notificationPermissionStatus === 'denied' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {notificationPermissionStatus || 'unknown'}
                    </span>
                  </p>
                  {token && (
                    <p className="text-xs text-gray-500 mt-1">
                      Token: {token.substring(0, 20)}...
                    </p>
                  )}
                </div>
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
                  disabled={isLoading || !token}
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

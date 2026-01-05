"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchPaginatedNotifications } from "@/app/actions/notification/main"

interface Notification {
  id: string
  title: string
  body: string
  type: string
  status: string
  createdAt: string
  readAt?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    try {
      const data = await fetchPaginatedNotifications(1, 20)
      if (data && data.notifications) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  function getNotificationIcon(type: string) {
    const iconMap: { [key: string]: typeof Bell } = {
      INFO: Info,
      SUCCESS: CheckCircle2,
      WARNING: AlertCircle,
      ERROR: AlertCircle,
    }
    const Icon = iconMap[type] || Bell
    return Icon
  }

  function getNotificationColor(type: string) {
    const colorMap: { [key: string]: string } = {
      INFO: "text-blue-500",
      SUCCESS: "text-green-500",
      WARNING: "text-yellow-500",
      ERROR: "text-red-500",
    }
    return colorMap[type] || "text-muted-foreground"
  }

  return (
        <><header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Notifications</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header><div className="flex flex-1 flex-col gap-4 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You&apos;re all caught up!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);
              const isUnread = !notification.readAt;

              return (
                <Card key={notification.id} className={isUnread ? "border-primary/50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className={`mt-1 ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          {isUnread && (
                            <Badge variant="default" className="shrink-0">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div></>
  )
}
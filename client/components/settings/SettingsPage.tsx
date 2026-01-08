"use client"

import { useEffect, useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Settings, LogOut, Users } from "lucide-react"
import { ThemeSettings } from "./ThemeSettings"
import { getCurrentUserProfile, checkUserPermissions } from "@/app/actions/user/main"
import { logout } from "@/lib/sessionAction"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ProfileDisplay } from "./ProfileDisplay"

interface UserProfile {
  id: string
  name: string
  username: string
  email: string
  phone?: string
  isAdmin: boolean
  roles: string[]
  createdAt?: string
}

interface Permissions {
  canManageUsers: boolean
  isAdmin: boolean
  roles: string[]
}

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [permissions, setPermissions] = useState<Permissions>({
    canManageUsers: false,
    isAdmin: false,
    roles: [],
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [profile, perms] = await Promise.all([getCurrentUserProfile(), checkUserPermissions()])
        setUserProfile(profile)
        setPermissions(perms)
      } catch (error) {
        console.error("Failed to load settings data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="hidden md:flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700 dark:text-slate-300" />
              </div>
              <span>Settings</span>
            </h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-4 sm:gap-6">
          {/* Profile Section */}
          <ProfileDisplay user={userProfile} isLoading={isLoading} />

          {/* Theme Settings */}
          <ThemeSettings />

          {/* User Management - Only for Project Managers and Admins */}
          {permissions.canManageUsers && (
            <Card className="border-border/50">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  User Management
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage users and their permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <Link href="/users">
                  <Button className="gap-2 w-full sm:w-auto text-sm sm:text-base">
                    <Users className="h-4 w-4" />
                    Go to User Management
                  </Button>
                </Link>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Access the dedicated user management page to view, create, and manage all users.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Logout Section */}
          <Card className="border-destructive/20 dark:border-destructive/30">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-destructive">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                </div>
                Session
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Sign out of your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="gap-2 w-full sm:w-auto text-sm sm:text-base"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
              <p className="text-xs sm:text-sm text-muted-foreground">
                This will sign you out of the application on this device.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

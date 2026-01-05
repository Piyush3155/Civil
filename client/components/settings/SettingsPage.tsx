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
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Settings, LogOut, Users } from "lucide-react"
import { ThemeSettings } from "./ThemeSettings"
import { ProfileDisplay } from "./ProfileDisplay"
import { 
  getCurrentUserProfile, 
  checkUserPermissions
} from "@/app/actions/user/main"
import { logout } from "@/lib/sessionAction"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
        const [profile, perms] = await Promise.all([
          getCurrentUserProfile(),
          checkUserPermissions(),
        ])
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
      <header className="hidden md:flex h-16 shrink-0 items-center gap-2 border-b px-4">
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

      <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="grid gap-6">
            {/* Profile Section */}
            <ProfileDisplay user={userProfile} isLoading={isLoading} />

            {/* Theme Settings */}
            <ThemeSettings />

            {/* User Management - Only for Project Managers and Admins */}
            {permissions.canManageUsers && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage users and their permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/users">
                    <Button className="gap-2">
                      <Users className="h-4 w-4" />
                      Go to User Management
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-4">
                    Access the dedicated user management page to view, create, and manage all users.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Logout Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-5 w-5" />
                  Session
                </CardTitle>
                <CardDescription>
                  Sign out of your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  This will sign you out of the application on this device.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}

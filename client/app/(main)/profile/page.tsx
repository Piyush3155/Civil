"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  User,
  Mail,
  Shield,
  Building2,
  ArrowLeft,
  Calendar,
} from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { getSession } from "@/lib/sessionAction"

interface UserProfile {
  username: string
  name: string
  email: string
  roles: string[]
  userId: string
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800'
    case 'PROJECT_MANAGER':
      return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800'
    case 'SITE_ENGINEER':
      return 'bg-green-500/10 text-green-600 border-green-200 dark:text-green-400 dark:border-green-800'
    case 'CONTRACTOR':
      return 'bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800'
    case 'LABOUR':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800'
    case 'CLIENT':
      return 'bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

const formatRole = (role: string) => {
  return role
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const session = await getSession()
        if (session.isLoggedIn) {
          setProfile({
            username: session.username || "",
            name: session.name || session.username || "",
            email: session.email || "",
            roles: session.roles || [],
            userId: session.userId || "",
          })
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      {/* Header */}
      <header className="hidden md:flex h-16 shrink-0 items-center justify-between border-b bg-background px-6 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <AnimatedThemeToggler className="h-9 w-9" />
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-[800px] mx-auto w-full animate-in fade-in duration-500">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center space-y-4 py-8">
          {isLoading ? (
            <>
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </>
          ) : profile ? (
            <>
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-3xl shadow-lg">
                {getInitials(profile.name)}
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {profile.roles.map((role) => (
                  <Badge
                    key={role}
                    variant="outline"
                    className={`font-medium ${getRoleBadgeColor(role)}`}
                  >
                    {formatRole(role)}
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Unable to load profile</p>
          )}
        </div>

        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details and roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : profile ? (
              <>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{profile.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email Address</p>
                    <p className="font-medium">{profile.email || "Not set"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Roles & Permissions</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.roles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className={`text-xs ${getRoleBadgeColor(role)}`}
                        >
                          {formatRole(role)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="font-medium">Active Member</p>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="w-full justify-start h-10 gap-2" asChild>
              <Link href="/settings">
                <Shield className="h-4 w-4 text-violet-500" />
                <span>Account Settings</span>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start h-10 gap-2" asChild>
              <Link href="/projects">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span>View Projects</span>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start h-10 gap-2" asChild>
              <Link href="/notifications">
                <Mail className="h-4 w-4 text-emerald-500" />
                <span>Notifications</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

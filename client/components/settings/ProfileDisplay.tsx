"use client"

import * as React from "react"
import {
  User,
  Mail,
  Shield,
  Calendar,
  Copy,
  Check,
  Briefcase,
  Edit,
  MapPin,
  Clock,
  Award,
  Activity,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

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

interface ProfileDisplayProps {
  user: UserProfile | null
  isLoading: boolean
}

export function ProfileDisplay({ user, isLoading }: ProfileDisplayProps) {
  const [isCopied, setIsCopied] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const handleCopyId = async () => {
    if (!user?.id) return
    await navigator.clipboard.writeText(user.id)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }

  const getRoleColor = (role: string) => {
    const colors = {
      PROJECT_MANAGER:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
      SITE_ENGINEER:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800",
      CONTRACTOR:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800",
      LABOUR:
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800",
      CLIENT: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800",
    }
    return (
      colors[role as keyof typeof colors] ||
      "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-800"
    )
  }

  const getDaysSinceJoined = (createdAt?: string) => {
    if (!createdAt) return null
    const joined = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - joined.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (!user) {
    return (
      <Card className="bg-muted/40 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
          <div className="relative mb-4 sm:mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted border-2 border-dashed">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Profile Not Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Unable to load user profile information. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    )
  }

  const daysSinceJoined = getDaysSinceJoined(user.createdAt)

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative h-24 sm:h-32 w-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100/20 to-slate-100/20 dark:from-slate-700/20 dark:to-slate-700/20" />
        </div>
      </div>

      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16 mb-6 sm:mb-8">
          {/* Enhanced Avatar */}
          <div
            className="relative group cursor-pointer flex-shrink-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className={cn(
                "flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl border-4 border-background bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 dark:from-slate-400 dark:via-slate-500 dark:to-slate-600 text-white shadow-lg transition-all duration-300",
                isHovered && "scale-105 shadow-xl",
              )}
            >
              <span className="text-3xl sm:text-4xl font-bold tracking-tight">{getInitials(user.name)}</span>
            </div>

            {/* Status indicator */}
            <div className="absolute -top-1 -right-1">
              <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-green-500 border-2 border-background shadow-sm">
                <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
              </div>
            </div>

            {/* Admin badge */}
            {user.isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-3 border-background bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg animate-pulse">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Administrator Account
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {isHovered && (
              <div className="absolute inset-0 rounded-3xl bg-black/10 backdrop-blur-sm flex items-center justify-center transition-all duration-200">
                <Edit className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2 sm:space-y-3 text-center sm:text-left">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{user.name}</h1>
                {user.isAdmin && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/50 text-amber-700 bg-amber-50/80 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-950/30 px-2 py-0.5 text-xs sm:px-3 sm:py-1"
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                <span className="font-medium">@{user.username}</span>
                {daysSinceJoined && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">{daysSinceJoined} days</span>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined{" "}
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Unknown"}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span>
                  {user.roles.length} role{user.roles.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyId}
                    className="gap-2 hover:bg-muted/80 transition-colors text-xs sm:text-sm bg-transparent"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="hidden sm:inline">{isCopied ? "Copied!" : "Copy ID"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy User ID</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Contact Information Card */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                <p className="text-xs sm:text-sm font-medium break-all">{user.email}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</label>
                <p className="text-xs sm:text-sm font-medium">
                  {user.phone || <span className="text-muted-foreground italic">Not provided</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Information Card */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User ID</label>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded break-all" title={user.id}>
                  {user.id.slice(0, 12)}...
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-medium">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles & Permissions Card */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <Badge
                      key={role}
                      className={cn(
                        "px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105",
                        getRoleColor(role),
                      )}
                    >
                      <Briefcase className="mr-1 h-3 w-3" />
                      {formatRole(role)}
                    </Badge>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground italic">
                    <MapPin className="h-4 w-4" />
                    No roles
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-24 sm:h-32 bg-gradient-to-br from-muted/60 to-muted/40 animate-pulse" />
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16 mb-6 sm:mb-8">
          <Skeleton className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl border-4 border-background flex-shrink-0" />
          <div className="space-y-2 sm:space-y-3 flex-1 w-full text-center sm:text-left">
            <Skeleton className="h-7 sm:h-9 w-48 mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
            <div className="flex gap-2 sm:gap-4 justify-center sm:justify-start">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/50">
            <CardHeader className="pb-2 sm:pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2 sm:pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card className="border-border/50 sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2 sm:pb-3">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

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
  Activity
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
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

  // Copy ID to clipboard
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
      PROJECT_MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
      SITE_ENGINEER: "bg-green-50 text-green-700 border-green-200",
      CONTRACTOR: "bg-orange-50 text-orange-700 border-orange-200",
      LABOUR: "bg-purple-50 text-purple-700 border-purple-200",
      CLIENT: "bg-pink-50 text-pink-700 border-pink-200",
    }
    return colors[role as keyof typeof colors] || "bg-gray-50 text-gray-700 border-gray-200"
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
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted border-2 border-dashed">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Profile Not Found</h3>
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
      {/* Enhanced Decorative Banner */}
      <div className="relative h-40 w-full bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-blue-500/15 border-b overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-100/20 to-purple-100/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />

        {/* Floating elements */}
        <div className="absolute top-4 right-6 opacity-20">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </div>

      <CardContent className="px-6 pb-6">
        {/* Header Section with Enhanced Avatar */}
        <div className="relative flex flex-col md:flex-row items-start md:items-end -mt-16 mb-8 gap-6">

          {/* Enhanced Avatar */}
          <div
            className="relative group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className={cn(
              "flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-background bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white shadow-xl transition-all duration-300",
              isHovered && "scale-105 shadow-2xl"
            )}>
              <span className="text-4xl font-bold tracking-tight">
                {getInitials(user.name)}
              </span>
            </div>

            {/* Status indicator */}
            <div className="absolute -top-1 -right-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 border-2 border-background shadow-sm">
                <Activity className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Admin badge */}
            {user.isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full border-3 border-background bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg animate-pulse">
                      <Shield className="h-5 w-5" />
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

            {/* Hover effect overlay */}
            {isHovered && (
              <div className="absolute inset-0 rounded-3xl bg-black/10 backdrop-blur-sm flex items-center justify-center transition-all duration-200">
                <Edit className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {/* Enhanced Name & Identity Section */}
          <div className="flex-1 space-y-3 pt-4 md:pt-0">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {user.name}
                </h1>
                {user.isAdmin && (
                  <Badge variant="outline" className="border-amber-500/50 text-amber-700 bg-amber-50/80 px-3 py-1">
                    <Shield className="mr-1.5 h-3 w-3" />
                    Administrator
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">@{user.username}</span>
                {daysSinceJoined && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    Member for {daysSinceJoined} days
                  </span>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span>{user.roles.length} role{user.roles.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyId}
                    className="gap-2 hover:bg-muted/80 transition-colors"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="hidden sm:inline">
                      {isCopied ? "Copied!" : "Copy ID"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy User ID to clipboard</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Enhanced Details Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Contact Information Card */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-200">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Email Address
                </label>
                <p className="text-sm font-medium break-all">{user.email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Phone Number
                </label>
                <p className="text-sm font-medium">
                  {user.phone || (
                    <span className="text-muted-foreground italic">Not provided</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Information Card */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 border border-green-200">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                System Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  User ID
                </label>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded break-all" title={user.id}>
                  {user.id}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Account Created
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles & Permissions Card */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 border border-purple-200">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                </div>
                Roles & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <Badge
                      key={role}
                      className={cn(
                        "px-3 py-1.5 font-medium transition-all duration-200 hover:scale-105",
                        getRoleColor(role)
                      )}
                    >
                      <Briefcase className="mr-1.5 h-3 w-3" />
                      {formatRole(role)}
                    </Badge>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                    <MapPin className="h-4 w-4" />
                    No roles assigned
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
      <div className="h-40 bg-gradient-to-br from-muted/60 to-muted/40 animate-pulse" />
      <CardContent className="px-6 pb-6">
        <div className="relative flex flex-col md:flex-row items-start md:items-end -mt-16 mb-8 gap-6">
          <Skeleton className="h-28 w-28 rounded-3xl border-4 border-background" />
          <div className="space-y-3 pt-4 md:pt-0 flex-1">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card className="border-border/50 md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
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
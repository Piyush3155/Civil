"use client"

import * as React from "react"
import {
  User,
  Mail,
  Calendar,
  Briefcase,
  Phone,
  ShieldCheck,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// --- Types ---
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

// --- Components ---

export function ProfileDisplay({ user, isLoading }: ProfileDisplayProps) {
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

  const getRoleStyle = (role: string) => {
    const styles = {
      PROJECT_MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      SITE_ENGINEER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      CONTRACTOR: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-800",
      LABOUR: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      CLIENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    }
    return styles[role as keyof typeof styles] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }

  if (isLoading) return <ProfileSkeleton />

  if (!user) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold">Profile Not Found</h3>
          <p className="text-muted-foreground mt-2">The requested user profile could not be loaded.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-border/60 shadow-lg transition-all duration-300 bg-card">
      {/* Modern Banner with Pattern */}
      <div className="relative h-32 md:h-40 w-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800" />
        {/* Abstract Grid/Dot Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>
        
        {/* Admin floating badge (Top Right) */}
        {user.isAdmin && (
          <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-500">
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-md gap-1.5 py-1.5 px-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrator
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="px-6 pb-8">
        {/* Header Section */}
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 mb-8">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-[6px] border-background bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl text-white">
              <span className="text-4xl font-bold tracking-tighter">{getInitials(user.name)}</span>
            </div>
             <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-green-500 border-4 border-background" title="Active" />
          </div>

          {/* Name & Quick Info */}
          <div className="flex-1 text-center md:text-left space-y-2 mt-2 md:mt-0">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{user.name}</h1>
              <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-1">
                @{user.username}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
              </span>
              <span className="hidden md:inline text-muted-foreground/40">•</span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                {user.roles.length} Roles
              </span>
            </div>
          </div>
          
        </div>

        <Separator className="my-6" />

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Contact Information */}
          <div className="space-y-4">
             <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Contact Details
             </h4>
             <div className="bg-muted/30 rounded-xl p-4 space-y-4 border border-border/50">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-background rounded-md shadow-sm text-blue-600">
                        <Mail className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                        <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                        <p className="text-sm font-medium truncate" title={user.email}>{user.email}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-background rounded-md shadow-sm text-green-600">
                        <Phone className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
                        <p className="text-sm font-medium">{user.phone || "Not provided"}</p>
                    </div>
                </div>
             </div>
          </div>

          {/* 2. Roles */}
          <div className="space-y-4">
             <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Roles & Permissions
             </h4>
             <div className="bg-muted/30 rounded-xl p-4 min-h-[120px] border border-border/50">
                {user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                            <Badge
                                key={role}
                                variant="outline"
                                className={cn("px-2.5 py-1 text-xs border font-medium", getRoleStyle(role))}
                            >
                                {formatRole(role)}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                        <Briefcase className="w-8 h-8 mb-2 opacity-20" />
                        No roles assigned
                    </div>
                )}
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileSkeleton() {
  return (
    <Card className="overflow-hidden bg-card">
      <div className="h-32 md:h-40 bg-muted animate-pulse" />
      <CardContent className="px-6 pb-8">
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 mb-8">
          <Skeleton className="h-32 w-32 rounded-3xl border-[6px] border-background" />
          <div className="flex-1 space-y-3 mt-2 md:mt-0 w-full flex flex-col items-center md:items-start">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-4">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { useEffect, useState, useCallback } from "react"
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
import { 
  KeyRound, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  getPasswordResetRequests, 
  getPasswordResetStats,
  approvePasswordReset,
  rejectPasswordReset
} from "@/app/actions/password-reset/main"
import { checkUserPermissions } from "@/app/actions/user/main"

interface PasswordResetRequest {
  id: string
  userId: string
  email: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"
  requestedAt: string
  processedAt?: string
  reason?: string
  user: {
    id: string
    name: string
    email: string
    username: string
    phone?: string
    roles: Array<{
      role: {
        id: string
        name: string
      }
    }>
  }
  admin?: {
    id: string
    name: string
    email: string
  }
}

interface Stats {
  pending: number
  approved: number
  rejected: number
  total: number
}

interface Permissions {
  canManageUsers: boolean
  isAdmin: boolean
  roles: string[]
}

export default function PasswordResetRequestsPage() {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState<Permissions>({
    canManageUsers: false,
    isAdmin: false,
    roles: [],
  })
  const [permissionsLoading, setPermissionsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("PENDING")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Approval dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(password)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Password copied to clipboard")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
      case "COMPLETED":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [requestsData, statsData] = await Promise.all([
        getPasswordResetRequests(statusFilter === "all" ? undefined : statusFilter),
        getPasswordResetStats()
      ])
      setRequests(requestsData)
      setStats(statsData)
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load password reset requests")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const perms = await checkUserPermissions()
        setPermissions(perms)
      } catch (error) {
        console.error("Failed to load permissions:", error)
      } finally {
        setPermissionsLoading(false)
      }
    }
    loadPermissions()
  }, [])

  useEffect(() => {
    if (permissions.canManageUsers) {
      loadData()
    }
  }, [statusFilter, permissions.canManageUsers, loadData])

  const filteredRequests = requests.filter((request) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      request.user.name.toLowerCase().includes(term) ||
      request.user.email.toLowerCase().includes(term) ||
      request.user.username.toLowerCase().includes(term)
    )
  })

  const handleApprove = async () => {
    if (!selectedRequest || !newPassword) {
      toast.error("Please enter a new password")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsApproving(true)
    try {
      await approvePasswordReset(selectedRequest.id, newPassword)
      toast.success(`Password reset approved for ${selectedRequest.user.name}`)
      setApproveDialogOpen(false)
      setSelectedRequest(null)
      setNewPassword("")
      loadData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to approve request"
      toast.error(errorMessage)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    setIsRejecting(true)
    try {
      await rejectPasswordReset(selectedRequest.id, rejectReason || undefined)
      toast.success(`Password reset rejected for ${selectedRequest.user.name}`)
      setRejectDialogOpen(false)
      setSelectedRequest(null)
      setRejectReason("")
      loadData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reject request"
      toast.error(errorMessage)
    } finally {
      setIsRejecting(false)
    }
  }

  const openApproveDialog = (request: PasswordResetRequest) => {
    setSelectedRequest(request)
    setNewPassword("")
    setApproveDialogOpen(true)
  }

  const openRejectDialog = (request: PasswordResetRequest) => {
    setSelectedRequest(request)
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  if (permissionsLoading) {
    return (
      <div className="bg-muted/30">
        <div className="flex items-center justify-center h-full p-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!permissions.canManageUsers) {
    return (
      <div className="bg-muted/30">
        <div className="flex items-center justify-center h-full p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                You don&apos;t have permission to manage password reset requests.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <header className="hidden md:flex h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden sm:block">
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Password Reset Requests</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-4 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <KeyRound className="h-6 w-6 sm:h-8 sm:w-8" />
              Password Reset Requests
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage user password reset requests</p>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Requests</CardTitle>
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-amber-700">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-700">{stats.approved}</div>
              <p className="text-xs text-muted-foreground mt-1">Password reset</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-700">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground mt-1">Declined</p>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Reset Requests</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Review and process password reset requests from users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <KeyRound className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No requests found</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter === "PENDING" 
                    ? "There are no pending password reset requests" 
                    : "Try adjusting your search or filter criteria"}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="space-y-3 lg:hidden">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                                {getInitials(request.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm truncate">{request.user.name}</div>
                              <div className="text-xs text-muted-foreground truncate">@{request.user.username}</div>
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="space-y-2 text-sm mb-3">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{request.user.email}</span>
                          </div>
                          {request.user.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{request.user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>Requested: {formatDate(request.requestedAt)}</span>
                          </div>
                        </div>

                        {request.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 gap-1"
                              onClick={() => openApproveDialog(request)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => openRejectDialog(request)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested At</TableHead>
                        <TableHead>Processed At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                  {getInitials(request.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{request.user.name}</div>
                                <div className="text-sm text-muted-foreground">@{request.user.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {request.user.email}
                              </div>
                              {request.user.phone && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {request.user.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(request.requestedAt)}</div>
                          </TableCell>
                          <TableCell>
                            {request.processedAt ? (
                              <div className="text-sm">{formatDate(request.processedAt)}</div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {request.status === "PENDING" ? (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="gap-1"
                                  onClick={() => openApproveDialog(request)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => openRejectDialog(request)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Processed</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Approve Password Reset
            </DialogTitle>
            <DialogDescription>
              Set a new password for {selectedRequest?.user.name}. Make sure to share the new password securely.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    {getInitials(selectedRequest.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedRequest.user.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedRequest.user.email}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Generate
                  </Button>
                </div>
                {newPassword && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => copyToClipboard(newPassword)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy password
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isApproving || !newPassword || newPassword.length < 6}
              className="gap-2"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve & Reset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Password Reset
            </DialogTitle>
            <DialogDescription>
              Reject the password reset request for {selectedRequest?.user.name}. You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    {getInitials(selectedRequest.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedRequest.user.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedRequest.user.email}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reject-reason">Reason (Optional)</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={isRejecting}
              variant="destructive"
              className="gap-2"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Reject Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

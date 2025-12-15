"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Users, Search, MoreHorizontal, Shield, Mail, Phone, Calendar, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useUsers } from "@/lib/queries/users";
import { useQueryClient } from '@tanstack/react-query';
import { checkUserPermissions, createUser } from "@/app/actions/user/main";


interface User {
  id: string
  name: string
  username: string
  email: string
  phone?: string
  isAdmin: boolean
  isVerified?: boolean
  createdAt: string
  updatedAt: string
  roles: Array<{
    role: {
      id: string
      name: string
      description?: string
    }
  }>
}

interface Permissions {
  canManageUsers: boolean
  isAdmin: boolean
  roles: string[]
}

export default function UserManagementPage() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { data: usersData, isLoading } = useUsers(currentPage, pageSize);
  const [permissions, setPermissions] = useState<Permissions>({
    canManageUsers: false,
    isAdmin: false,
    roles: [],
  });
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  const [createFormData, setCreateFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "",
  })


  // Filtering will be applied to the current page (`usersData.users`)

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


  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const perms = await checkUserPermissions();
        setPermissions(perms);
      } catch (error) {
        console.error("Failed to load permissions:", error);
      } finally {
        setPermissionsLoading(false);
      }
    };
    loadPermissions();
  }, []);

  // Apply filters to the current page of users
  useEffect(() => {
    if (!usersData?.users) {
      setFilteredUsers([]);
      return;
    }

    let filtered = usersData.users;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.username.toLowerCase().includes(term),
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(
        (user) =>
          user.roles.some((userRole) => userRole.role.name === roleFilter) || (roleFilter === "ADMIN" && user.isAdmin),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => {
        if (statusFilter === "verified") return user.isVerified;
        if (statusFilter === "unverified") return !user.isVerified;
        if (statusFilter === "admin") return user.isAdmin;
        return true;
      });
    }

    setFilteredUsers(filtered);
  }, [usersData, searchTerm, roleFilter, statusFilter]);

  const handleCreateUser = async () => {
    if (!createFormData.name || !createFormData.username || !createFormData.email || !createFormData.password) {
      return
    }

    setIsCreating(true)
    try {
      await createUser({
        name: createFormData.name,
        username: createFormData.username,
        email: createFormData.email,
        password: createFormData.password,
        phone: createFormData.phone || undefined,
        role: createFormData.role || undefined,
      })

      // Reset form and close dialog
      setCreateFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        phone: "",
        role: "",
      })
      setIsCreateDialogOpen(false)

      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      console.error("Failed to create user:", error)
    } finally {
      setIsCreating(false)
    }
  }

  if (permissionsLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full p-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!permissions.canManageUsers) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full p-4">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have permission to access user management.
                </p>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>User Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Users className="h-6 w-6 sm:h-8 sm:w-8" />
                User Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage user accounts and permissions</p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system. Fill in the required fields below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">
                      Username <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="username"
                      value={createFormData.username}
                      onChange={(e) => setCreateFormData((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={createFormData.phone}
                      onChange={(e) => setCreateFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={createFormData.role}
                      onValueChange={(value) => setCreateFormData((prev) => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                        <SelectItem value="SITE_ENGINEER">Site Engineer</SelectItem>
                        <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                        <SelectItem value="LABOUR">Labour</SelectItem>
                        <SelectItem value="CLIENT">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleCreateUser}
                    disabled={
                      isCreating ||
                      !createFormData.name ||
                      !createFormData.username ||
                      !createFormData.email ||
                      !createFormData.password
                    }
                    className="w-full sm:w-auto"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{usersData?.pagination?.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">All registered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{filteredUsers.filter((user) => user.isAdmin).length}</div>
                <p className="text-xs text-muted-foreground mt-1">Administrator accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Verified</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{filteredUsers.filter((user) => user.isVerified).length}</div>
                <p className="text-xs text-muted-foreground mt-1">Email verified</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Active Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {
                    (usersData?.users || []).filter((user) => {
                      const lastActive = new Date(user.updatedAt)
                      const today = new Date()
                      return lastActive.toDateString() === today.toDateString()
                    }).length
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">Updated today</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Users Directory</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Search and filter users by name, email, role, or status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                      <SelectItem value="SITE_ENGINEER">Site Engineer</SelectItem>
                      <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                      <SelectItem value="LABOUR">Labour</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="admin">Administrators</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 lg:hidden">
                    {filteredUsers.map((user) => (
                      <Card key={user.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Avatar className="h-12 w-12 shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm truncate">{user.name}</div>
                                <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Edit User</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">Delete User</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {user.isVerified ? (
                              <Badge variant="default" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                Verified
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                              >
                                Unverified
                              </Badge>
                            )}
                            {user.isAdmin && (
                              <Badge variant="destructive" className="text-xs">
                                Admin
                              </Badge>
                            )}
                            {user.roles.map((userRole) => (
                              <Badge key={userRole.role.id} className={`text-xs ${getRoleColor(userRole.role.name)}`}>
                                {formatRole(userRole.role.name)}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="hidden lg:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-muted-foreground">@{user.username}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {user.email}
                                </div>
                                {user.phone && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.isAdmin && (
                                  <Badge variant="destructive" className="text-xs">
                                    Admin
                                  </Badge>
                                )}
                                {user.roles.map((userRole) => (
                                  <Badge
                                    key={userRole.role.id}
                                    className={`text-xs ${getRoleColor(userRole.role.name)}`}
                                  >
                                    {formatRole(userRole.role.name)}
                                  </Badge>
                                ))}
                                {user.roles.length === 0 && !user.isAdmin && (
                                  <span className="text-xs text-muted-foreground">No roles</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {user.isVerified ? (
                                  <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    Unverified
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>View Profile</DropdownMenuItem>
                                  <DropdownMenuItem>Edit User</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">Delete User</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {usersData?.pagination && usersData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, usersData.pagination.total)} of {usersData.pagination.total} users
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {usersData.pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(usersData.pagination.totalPages, prev + 1))}
                          disabled={currentPage === usersData.pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

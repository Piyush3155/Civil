"use client";

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  Edit, 
  Trash2,
  Calendar 
} from "lucide-react"
import { useEffect, useState } from "react"
import { 
  fetchContractors, 
  createContractor,
  updateContractor,
  deleteContractor 
} from "@/app/actions/contractors/main"
import Loader from "@/components/ui/loader";

interface Contractor {
  id: string
  name: string
  type: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  createdAt: string
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "MAIN",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  })

  useEffect(() => {
    loadContractors()
  }, [])

  async function loadContractors() {
    try {
      const data = await fetchContractors()
      setContractors(data)
    } catch (error) {
      console.error("Error loading contractors:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateContractor(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createContractor(formData)
      setCreateDialogOpen(false)
      resetForm()
      await loadContractors()
    } catch (error) {
      console.error("Error creating contractor:", error)
      alert("Failed to create contractor")
    }
  }

  async function handleUpdateContractor(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedContractor) return

    try {
      await updateContractor(selectedContractor.id, formData)
      setEditDialogOpen(false)
      setSelectedContractor(null)
      resetForm()
      await loadContractors()
    } catch (error) {
      console.error("Error updating contractor:", error)
      alert("Failed to update contractor")
    }
  }

  async function handleDeleteContractor(id: string) {
    if (!confirm("Are you sure you want to delete this contractor?")) {
      return
    }

    try {
      await deleteContractor(id)
      await loadContractors()
    } catch (error) {
      console.error("Error deleting contractor:", error)
      alert("Failed to delete contractor")
    }
  }

  function openEditDialog(contractor: Contractor) {
    setSelectedContractor(contractor)
    setFormData({
      name: contractor.name,
      type: contractor.type,
      contactPerson: contractor.contactPerson || "",
      phone: contractor.phone || "",
      email: contractor.email || "",
      address: contractor.address || "",
    })
    setEditDialogOpen(true)
  }

  function resetForm() {
    setFormData({
      name: "",
      type: "MAIN",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    })
  }

  function getTypeBadge(type: string) {
    const variants: { [key: string]: string } = {
      MAIN: "default",
      SUB: "secondary",
      LABOUR_SUPPLY: "outline",
    }
    return variants[type] || "default"
  }

  const ContractorForm = ({ onSubmit, submitText }: { onSubmit: (e: React.FormEvent) => void, submitText: string }) => (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            placeholder="ABC Construction Ltd."
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type">Contractor Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MAIN">Main Contractor</SelectItem>
              <SelectItem value="SUB">Sub Contractor</SelectItem>
              <SelectItem value="LABOUR_SUPPLY">Labour Supply</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input
            id="contactPerson"
            placeholder="John Doe"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@contractor.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="123 Business District"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">{submitText}</Button>
      </DialogFooter>
    </form>
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Contractors</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <Dialog open={createDialogOpen} onOpenChange={(open) => {
              setCreateDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Contractor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Contractor</DialogTitle>
                  <DialogDescription>
                    Register a new contractor company
                  </DialogDescription>
                </DialogHeader>
                <ContractorForm onSubmit={handleCreateContractor} submitText="Create Contractor" />
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader />
            </div>
          ) : contractors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No contractors yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first contractor to get started
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contractor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contractors.map((contractor) => (
                <Card key={contractor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                          <h3 className="font-semibold">{contractor.name}</h3>
                          <Badge variant={getTypeBadge(contractor.type) as "default" | "secondary" | "outline"} className="mt-1">
                            {contractor.type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {contractor.contactPerson && (
                        <p className="text-sm text-muted-foreground">
                          Contact: {contractor.contactPerson}
                        </p>
                      )}
                      {contractor.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-2 h-4 w-4" />
                          {contractor.phone}
                        </div>
                      )}
                      {contractor.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-2 h-4 w-4" />
                          {contractor.email}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground pt-2 border-t">
                        <Calendar className="mr-2 h-4 w-4" />
                        Added {new Date(contractor.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(contractor)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteContractor(contractor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) {
              setSelectedContractor(null)
              resetForm()
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Contractor</DialogTitle>
                <DialogDescription>
                  Update contractor information
                </DialogDescription>
              </DialogHeader>
              <ContractorForm onSubmit={handleUpdateContractor} submitText="Save Changes" />
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

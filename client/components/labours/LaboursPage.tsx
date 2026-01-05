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
  HardHat, 
  Phone, 
  Edit, 
  Trash2,
  User,
  Building2
} from "lucide-react"
import { useEffect, useState } from "react"
import { 
  fetchLabours, 
  createLabour,
  updateLabour,
  deleteLabour 
} from "@/app/actions/labours/main"
import { fetchContractors } from "@/app/actions/contractors/main"
import Loader from "@/components/ui/loader";

interface Labour {
  id: string
  name: string
  skill: string
  phone?: string
  age?: number
  gender?: string
  address?: string
  contractor?: {
    id: string
    name: string
  }
}

interface Contractor {
  id: string
  name: string
}

export default function LaboursPage() {
  const [labours, setLabours] = useState<Labour[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    skill: "UNSKILLED",
    phone: "",
    age: "",
    gender: "MALE",
    address: "",
    contractorId: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [laboursData, contractorsData] = await Promise.all([
        fetchLabours(),
        fetchContractors()
      ])
      setLabours(laboursData)
      setContractors(contractorsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateLabour(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
      }
      await createLabour(data)
      setCreateDialogOpen(false)
      resetForm()
      await loadData()
    } catch (error) {
      console.error("Error creating labour:", error)
      alert("Failed to create labour")
    }
  }

  async function handleUpdateLabour(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLabour) return

    try {
      const data = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
      }
      await updateLabour(selectedLabour.id, data)
      setEditDialogOpen(false)
      setSelectedLabour(null)
      resetForm()
      await loadData()
    } catch (error) {
      console.error("Error updating labour:", error)
      alert("Failed to update labour")
    }
  }

  async function handleDeleteLabour(id: string) {
    if (!confirm("Are you sure you want to delete this labour record?")) {
      return
    }

    try {
      await deleteLabour(id)
      await loadData()
    } catch (error) {
      console.error("Error deleting labour:", error)
      alert("Failed to delete labour")
    }
  }

  function openEditDialog(labour: Labour) {
    setSelectedLabour(labour)
    setFormData({
      name: labour.name,
      skill: labour.skill,
      phone: labour.phone || "",
      age: labour.age?.toString() || "",
      gender: labour.gender || "MALE",
      address: labour.address || "",
      contractorId: labour.contractor?.id || "",
    })
    setEditDialogOpen(true)
  }

  function resetForm() {
    setFormData({
      name: "",
      skill: "UNSKILLED",
      phone: "",
      age: "",
      gender: "MALE",
      address: "",
      contractorId: "",
    })
  }

  function getSkillBadge(skill: string) {
    const variants: { [key: string]: string } = {
      UNSKILLED: "secondary",
      SEMI_SKILLED: "default",
      SKILLED: "outline",
      HIGHLY_SKILLED: "default",
    }
    return variants[skill] || "secondary"
  }

  const LabourForm = ({ onSubmit, submitText }: { onSubmit: (e: React.FormEvent) => void, submitText: string }) => (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Worker Name *</Label>
          <Input
            id="name"
            placeholder="Rajesh Kumar"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="skill">Skill Level *</Label>
          <Select
            value={formData.skill}
            onValueChange={(value) =>
              setFormData({ ...formData, skill: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNSKILLED">Unskilled</SelectItem>
              <SelectItem value="SEMI_SKILLED">Semi-Skilled</SelectItem>
              <SelectItem value="SKILLED">Skilled</SelectItem>
              <SelectItem value="HIGHLY_SKILLED">Highly Skilled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contractor">Contractor</Label>
          <Select
            value={formData.contractorId}
            onValueChange={(value) =>
              setFormData({ ...formData, contractorId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select contractor (optional)" />
            </SelectTrigger>
            <SelectContent>
              {contractors.map((contractor) => (
                <SelectItem key={contractor.id} value={contractor.id}>
                  {contractor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="30"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData({ ...formData, gender: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Village, District, State"
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
    <div className="bg-background min-h-screen">
      <header className="hidden md:flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Workers</BreadcrumbPage>
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
                  Add Worker
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Worker</DialogTitle>
                  <DialogDescription>
                    Register a new worker on site
                  </DialogDescription>
                </DialogHeader>
                <LabourForm onSubmit={handleCreateLabour} submitText="Add Worker" />
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
                  <Loader />
            </div>
          ) : labours.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <HardHat className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workers yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first worker to get started
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Worker
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {labours.map((labour) => (
                <Card key={labour.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <HardHat className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                          <h3 className="font-semibold">{labour.name}</h3>
                          <Badge variant={getSkillBadge(labour.skill) as "default" | "secondary" | "outline"} className="mt-1">
                            {labour.skill.replace("_", " ")}
                          </Badge>
                        </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {labour.contractor && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Building2 className="mr-2 h-4 w-4" />
                          {labour.contractor.name}
                        </div>
                      )}
                      {labour.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-2 h-4 w-4" />
                          {labour.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="mr-2 h-4 w-4" />
                        {labour.age && `${labour.age} years`}
                        {labour.age && labour.gender && " • "}
                        {labour.gender}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(labour)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteLabour(labour.id)}
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
              setSelectedLabour(null)
              resetForm()
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Worker</DialogTitle>
                <DialogDescription>
                  Update worker information
                </DialogDescription>
              </DialogHeader>
              <LabourForm onSubmit={handleUpdateLabour} submitText="Save Changes" />
            </DialogContent>
          </Dialog>
        </div>
      
    </div>
  )
}
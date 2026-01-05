"use client"

import type React from "react"

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import {
  fetchEquipmentCategories,
  createEquipmentCategory,
  updateEquipmentCategory,
  deleteEquipmentCategory
} from "@/app/actions/equipment-category/main"
import { EquipmentCategory } from "@/types/equipment"

export default function EquipmentCategoryPage() {
  const [categories, setCategories] = useState<EquipmentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const data = await fetchEquipmentCategories()
      setCategories(data)
    } catch (error) {
      console.error("Error loading equipment categories:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    try {
      await createEquipmentCategory(formData)
      setDialogOpen(false)
      setFormData({ name: "", description: "" })
      await loadCategories()
    } catch (error) {
      console.error("Error creating equipment category:", error)
      alert("Failed to create equipment category")
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCategory) return

    setCreating(true)

    try {
      await updateEquipmentCategory(editingCategory.id, formData)
      setDialogOpen(false)
      setEditingCategory(null)
      setFormData({ name: "", description: "" })
      await loadCategories()
    } catch (error) {
      console.error("Error updating equipment category:", error)
      alert("Failed to update equipment category")
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await deleteEquipmentCategory(id)
      await loadCategories()
    } catch (error) {
      console.error("Error deleting equipment category:", error)
      alert("Failed to delete equipment category")
    }
  }

  function openEditDialog(category: EquipmentCategory) {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
    })
    setDialogOpen(true)
  }

  function openCreateDialog() {
    setEditingCategory(null)
    setFormData({ name: "", description: "" })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name: "", description: "" })
  }

  if (loading) {
    return (
      <div className="bg-muted">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted">
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">Equipment Categories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Equipment Categories</CardTitle>
                  <CardDescription>
                    Manage equipment categories for your construction projects.
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog} className="gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Category</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                      <DialogHeader>
                        <DialogTitle>
                          {editingCategory ? "Edit Equipment Category" : "Create Equipment Category"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingCategory
                            ? "Update the equipment category details below."
                            : "Add a new equipment category to organize your equipment."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Category Name *</Label>
                          <Input
                            id="name"
                            placeholder="Excavators, Trucks, Cranes..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Optional description for this category..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeDialog}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={creating}>
                          {creating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {editingCategory ? "Updating..." : "Creating..."}
                            </>
                          ) : (
                            editingCategory ? "Update Category" : "Create Category"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No equipment categories found.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first category to start organizing equipment.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <Card key={category.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Equipment Category</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &quot;{category.name}&quot;? This action cannot be undone.
                                    All equipment in this category will need to be reassigned.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {category.description ? (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No description</p>
                        )}
                        <div className="mt-3 text-xs text-muted-foreground">
                          Created {new Date(category.createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    )
}
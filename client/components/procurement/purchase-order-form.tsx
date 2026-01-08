"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save, 
  Building2, 
  Package, 
  FileText,
  Calculator
} from "lucide-react";
import { Supplier } from "@/types/procurement";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "../ui/breadcrumb";
import { SidebarTrigger } from "../ui/sidebar";

// --- Types ---
interface Material {
  id: string;
  name: string;
  unit: string;
}

interface POItemInput {
  materialId: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  notes: string;
}

export default function PurchaseOrderForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [formData, setFormData] = useState({
    supplierId: "",
    deliveryAddress: "",
    paymentTerms: "",
    notes: "",
  });

  const [items, setItems] = useState<POItemInput[]>([
    { materialId: "", quantity: 0, unitPrice: 0, taxPercent: 0, notes: "" },
  ]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        const [suppliersRes, materialsRes] = await Promise.all([
          apiRequest("/procurement/suppliers?isActive=true"),
          apiRequest("/materials"),
        ]);
        setSuppliers(suppliersRes);
        setMaterials(materialsRes);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Connection Error",
          description: "Could not load suppliers or materials.",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  // --- Handlers ---
  const handleAddItem = () => {
    setItems([
      ...items,
      { materialId: "", quantity: 0, unitPrice: 0, taxPercent: 0, notes: "" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (
    index: number,
    field: keyof POItemInput,
    value: string
  ) => {
    const newItems = [...items];
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxPercent') {
      newItems[index] = { ...newItems[index], [field]: parseFloat(value) || 0 };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  // --- Calculations ---
  const calculateSubtotal = () => {
    return items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0
    );
  };

  const calculateTax = () => {
    return items.reduce((acc, item) => {
      const amount = item.quantity * item.unitPrice;
      return acc + amount * (item.taxPercent / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (
      items.some(
        (item) => !item.materialId || item.quantity <= 0 || item.unitPrice <= 0
      )
    ) {
      toast({
        title: "Validation Error",
        description: "Please check item quantities and prices.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/procurement/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          projectId,
          items: items.map((item) => ({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxPercent: Number(item.taxPercent),
          })),
        }),
      });

      toast({
        title: "Success",
        description: "Purchase order created successfully.",
        variant: "success",
      });
      router.push(`/projects/${projectId}/procurement`);
    } catch (error) {
      console.error("Error creating PO:", error);
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error ? error.message : "Failed to create purchase order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-muted/20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Loading procurement data...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Sticky Header */}
      <header className="hidden md:flex sticky top-0 z-40 h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">Purchase order</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm md:text-xl font-bold tracking-tight text-foreground">
              New Purchase Order
            </h1>
           {/*  <p className="text-xs text-muted-foreground hidden sm:block">
              Project ID: {projectId}
            </p> */}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="px-0 md:px-6">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Create Order
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          
          {/* Section 1: Supplier & Logic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Supplier Details (Takes 2 columns on md+) */}
            <Card className="md:col-span-2 shadow-sm border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Supplier Information</CardTitle>
                </div>
                <CardDescription>Select vendor and delivery terms</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Supplier <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, supplierId: val })
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Input
                    placeholder="e.g. Net 30"
                    value={formData.paymentTerms}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentTerms: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Location</Label>
                  <Input
                    placeholder="Site address..."
                    value={formData.deliveryAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes (Takes 1 column) */}
            <Card className="md:col-span-1 shadow-sm border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Notes</CardTitle>
                </div>
                <CardDescription>Internal or external remarks</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any specific instructions here..."
                  className="min-h-[135px] resize-none bg-background"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Items Table */}
          <Card className="shadow-sm border-border/60 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Order Items</CardTitle>
                  </div>
                  <CardDescription>
                    Add materials and quantities to the order
                  </CardDescription>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddItem}
                  type="button"
                  className="shrink-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="w-[32px] pl-3">#</TableHead>
                      <TableHead className="min-w-[250px]">Material</TableHead>
                      <TableHead className="w-[100px]">Qty</TableHead>
                      <TableHead className="w-[120px]">Unit Price (₹)</TableHead>
                      <TableHead className="w-[80px]">Tax (%)</TableHead>
                      <TableHead className="w-[120px] text-right">Total</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/5">
                        <TableCell className="pl-3 font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.materialId}
                            onValueChange={(val) =>
                              handleItemChange(index, "materialId", val)
                            }
                          >
                            <SelectTrigger className="border-0 shadow-none hover:bg-muted/50 h-9 p-2">
                              <SelectValue placeholder="Select Material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((material) => (
                                <SelectItem key={material.id} value={material.id}>
                                  <span className="font-medium text-foreground">
                                    {material.name}
                                  </span>{" "}
                                  <span className="text-muted-foreground text-xs">
                                    ({material.unit})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            className="h-8 w-[80px] border-muted-foreground/20 text-center"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="h-8 w-[100px] border-muted-foreground/20 pl-5"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(index, "unitPrice", e.target.value)
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="h-8 w-[60px] border-muted-foreground/20 pr-6 text-right"
                              value={item.taxPercent}
                              onChange={(e) =>
                                handleItemChange(index, "taxPercent", e.target.value)
                              }
                            />
                            <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹
                          {(
                            item.quantity *
                            item.unitPrice *
                            (1 + item.taxPercent / 100)
                          ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length === 1}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            
            {/* Summary Footer */}
            <CardFooter className="flex flex-col items-end border-t bg-muted/10 p-4 md:p-6">
               <div className="w-full max-w-sm space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Subtotal:</span>
                   <span>₹{calculateSubtotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Tax Amount:</span>
                   <span>₹{calculateTax().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                 </div>
                 <Separator className="my-2" />
                 <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-base">Total</span>
                   </div>
                   <span className="font-bold text-lg text-primary">
                     ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                   </span>
                 </div>
               </div>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}
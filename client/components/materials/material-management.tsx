"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Truck,
  Wrench,
  Plus,
} from "lucide-react";
import {
  createMaterial,
  fetchMaterials,
  createMaterialDelivery,
  createMaterialUsage,
  fetchMaterialLedger,
  fetchMaterialUsages,
  fetchMaterialDeliveries,
} from "@/app/actions/materials/main";
import { StockManagement } from "@/components/inventory/stock-management";
import { Project } from "@/types/analytics";

interface Material {
  id: string;
  name: string;
  description?: string;
  unit: string;
}

interface Contractor {
  id: string;
  name: string;
  type: string;
}

interface Labour {
  id: string;
  name: string;
}

interface MaterialLedgerItem {
  material: Material;
  received: number;
  used: number;
  closing: number;
  totalDeliveredCost: number;
  totalUsedCost: number;
  remainingValue: number;
}

interface ProjectTotals {
  totalDeliveredCost: number;
  totalUsedCost: number;
  remainingValue: number;
}

interface MaterialLedgerData {
  materials: MaterialLedgerItem[];
  projectTotals: ProjectTotals;
}

interface MaterialUsage {
  id: string;
  materialId: string;
  contractorId?: string;
  labourId?: string;
  quantityUsed: number;
  usageDate: string;
  usedFor?: string;
  notes?: string;
  material: Material;
  contractor?: Contractor;
  labour?: Labour;
  project: Project;
}

interface MaterialDelivery {
  id: string;
  materialId: string;
  contractorId?: string;
  supplierName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  deliveryDate: string;
  challanNumber?: string;
  notes?: string;
  qcStatus: string;
  material: Material;
  contractor?: Contractor;
  supplier?: string;
  purchaseOrder?: string;
  project: Project;
}

interface MaterialManagementProps {
  projectId: string;
  contractors?: Contractor[];
  labours?: Labour[];
}

export function MaterialManagement({ projectId, contractors = [], labours = [] }: MaterialManagementProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [ledger, setLedger] = useState<MaterialLedgerData | null>(null);
  const [usages, setUsages] = useState<MaterialUsage[]>([]);
  const [deliveries, setDeliveries] = useState<MaterialDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [usagesLoading, setUsagesLoading] = useState(false);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  // Dialog states
  const [createMaterialDialog, setCreateMaterialDialog] = useState(false);
  const [deliveryDialog, setDeliveryDialog] = useState(false);
  const [usageDialog, setUsageDialog] = useState(false);

  // Form states
  const [materialForm, setMaterialForm] = useState({
    name: "",
    description: "",
    unit: "",
  });

  const [deliveryForm, setDeliveryForm] = useState({
    materialId: "",
    contractorId: "",
    supplierName: "",
    quantity: "",
    unitPrice: "",
    totalPrice: "",
    deliveryDate: "",
    challanNumber: "",
    notes: "",
    qcStatus: "PENDING",
  });

  const [usageForm, setUsageForm] = useState({
    materialId: "",
    contractorId: "",
    labourId: "",
    quantityUsed: "",
    usageDate: "",
    usedFor: "",
    notes: "",
  });

  const loadLedger = useCallback(async () => {
    try {
      setLedgerLoading(true);
      const data = await fetchMaterialLedger(projectId);
      setLedger(data);
    } catch (error) {
      console.error("Error loading ledger:", error);
    } finally {
      setLedgerLoading(false);
    }
  }, [projectId]);

  const loadUsages = useCallback(async () => {
    try {
      setUsagesLoading(true);
      const data = await fetchMaterialUsages(projectId);
      setUsages(data);
    } catch (error) {
      console.error("Error loading usages:", error);
    } finally {
      setUsagesLoading(false);
    }
  }, [projectId]);

  const loadDeliveries = useCallback(async () => {
    try {
      setDeliveriesLoading(true);
      const data = await fetchMaterialDeliveries(projectId);
      setDeliveries(data);
    } catch (error) {
      console.error("Error loading deliveries:", error);
    } finally {
      setDeliveriesLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadMaterials();
    loadLedger();
    loadUsages();
    loadDeliveries();
  }, [projectId, loadLedger, loadUsages, loadDeliveries]);

  async function loadMaterials() {
    try {
      const data = await fetchMaterials();
      setMaterials(data);
    } catch (error) {
      console.error("Error loading materials:", error);
    }
  }

  async function handleCreateMaterial(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await createMaterial(materialForm);
      setCreateMaterialDialog(false);
      setMaterialForm({ name: "", description: "", unit: "" });
      await loadMaterials();
    } catch (error) {
      console.error("Error creating material:", error);
      alert("Failed to create material");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDelivery(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await createMaterialDelivery(projectId, {
        ...deliveryForm,
        quantity: parseFloat(deliveryForm.quantity),
        unitPrice: deliveryForm.unitPrice ? parseFloat(deliveryForm.unitPrice) : undefined,
        totalPrice: deliveryForm.totalPrice ? parseFloat(deliveryForm.totalPrice) : undefined,
      });
      setDeliveryDialog(false);
      setDeliveryForm({
        materialId: "",
        contractorId: "",
        supplierName: "",
        quantity: "",
        unitPrice: "",
        totalPrice: "",
        deliveryDate: "",
        challanNumber: "",
        notes: "",
        qcStatus: "PENDING",
      });
      await loadLedger();
      await loadDeliveries();
    } catch (error) {
      console.error("Error creating delivery:", error);
      alert("Failed to create delivery");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUsage(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await createMaterialUsage(projectId, {
        ...usageForm,
        quantityUsed: parseFloat(usageForm.quantityUsed),
      });
      setUsageDialog(false);
      setUsageForm({
        materialId: "",
        contractorId: "",
        labourId: "",
        quantityUsed: "",
        usageDate: "",
        usedFor: "",
        notes: "",
      });
      await loadLedger();
      await loadUsages();
    } catch (error) {
      console.error("Error creating usage:", error);
      alert("Failed to create usage");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Management
            </CardTitle>
            <CardDescription>
              Track material deliveries, usage, and inventory for this project
            </CardDescription>
          </div>
          <Dialog open={createMaterialDialog} onOpenChange={setCreateMaterialDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleCreateMaterial}>
                <DialogHeader>
                  <DialogTitle>Create New Material</DialogTitle>
                  <DialogDescription>
                    Add a new material to the master list
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="material-name">Material Name *</Label>
                    <Input
                      id="material-name"
                      value={materialForm.name}
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="material-description">Description</Label>
                    <Textarea
                      id="material-description"
                      value={materialForm.description}
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="material-unit">Unit *</Label>
                    <Select
                      value={materialForm.unit}
                      onValueChange={(value) =>
                        setMaterialForm({ ...materialForm, unit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAG">Bag</SelectItem>
                        <SelectItem value="TON">Ton</SelectItem>
                        <SelectItem value="KG">Kg</SelectItem>
                        <SelectItem value="CFT">CFT</SelectItem>
                        <SelectItem value="PCS">Pieces</SelectItem>
                        <SelectItem value="LTR">Liters</SelectItem>
                        <SelectItem value="MTR">Meters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateMaterialDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Material"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ledger" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ledger">Material Ledger</TabsTrigger>
            <TabsTrigger value="deliveries">Delivery Records</TabsTrigger>
            <TabsTrigger value="usage">Usage Records</TabsTrigger>
            <TabsTrigger value="inventory">Stock Management</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Material Stock Summary</h3>
              <Button variant="outline" size="sm" onClick={loadLedger} disabled={ledgerLoading}>
                {ledgerLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>

            {/* Cost Summary */}
            {ledger && ledger.projectTotals && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Delivered Cost</p>
                        <p className="text-2xl font-bold">₹{ledger.projectTotals.totalDeliveredCost.toLocaleString()}</p>
                      </div>
                      <Truck className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Used Cost</p>
                        <p className="text-2xl font-bold">₹{Math.round(ledger.projectTotals.totalUsedCost).toLocaleString()}</p>
                      </div>
                      <Wrench className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Remaining Value</p>
                        <p className="text-2xl font-bold">₹{Math.round(ledger.projectTotals.remainingValue).toLocaleString()}</p>
                      </div>
                      <Package className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {ledger && ledger.materials.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Closing Stock</TableHead>
                    <TableHead className="text-right">Delivered Cost</TableHead>
                    <TableHead className="text-right">Used Cost</TableHead>
                    <TableHead className="text-right">Remaining Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.materials.map((item) => (
                    <TableRow key={item.material.id}>
                      <TableCell className="font-medium">
                        {item.material.name}
                      </TableCell>
                      <TableCell>{item.material.unit}</TableCell>
                      <TableCell className="text-right">{item.received}</TableCell>
                      <TableCell className="text-right">{item.used}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.closing}
                      </TableCell>
                      <TableCell className="text-right">₹{Math.round(item.totalDeliveredCost).toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{Math.round(item.totalUsedCost).toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{Math.round(item.remainingValue).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.closing > 0 ? "default" : item.closing === 0 ? "secondary" : "destructive"}
                        >
                          {item.closing > 0 ? "In Stock" : item.closing === 0 ? "Depleted" : "Negative"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No material transactions yet</p>
                <p className="text-sm">Start by recording deliveries or usage</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Material Deliveries</h3>
              <Button variant="outline" size="sm" onClick={loadDeliveries} disabled={deliveriesLoading}>
                {deliveriesLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>

            {deliveries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>QC Status</TableHead>
                    <TableHead>Challan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>{new Date(delivery.deliveryDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{delivery.material.name}</TableCell>
                      <TableCell>{delivery.supplierName}</TableCell>
                      <TableCell>{delivery.quantity} {delivery.material.unit}</TableCell>
                      <TableCell>{delivery.unitPrice ? `₹${delivery.unitPrice}` : '-'}</TableCell>
                      <TableCell>{delivery.totalPrice ? `₹${delivery.totalPrice.toLocaleString()}` : '-'}</TableCell>
                      <TableCell>{delivery.contractor?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            delivery.qcStatus === 'APPROVED' ? 'default' :
                            delivery.qcStatus === 'REJECTED' ? 'destructive' : 'secondary'
                          }
                        >
                          {delivery.qcStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{delivery.challanNumber || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No delivery records yet</p>
                <p className="text-sm">Start by recording material deliveries</p>
              </div>
            )}

            <Dialog open={deliveryDialog} onOpenChange={setDeliveryDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Truck className="mr-2 h-4 w-4" />
                  Add Delivery
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleCreateDelivery}>
                  <DialogHeader>
                    <DialogTitle>Record Material Delivery</DialogTitle>
                    <DialogDescription>
                      Log materials received on site
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="delivery-material">Material *</Label>
                        <Select
                          value={deliveryForm.materialId}
                          onValueChange={(value) =>
                            setDeliveryForm({ ...deliveryForm, materialId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.name} ({material.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="delivery-contractor">Contractor</Label>
                        <Select
                          value={deliveryForm.contractorId}
                          onValueChange={(value) =>
                            setDeliveryForm({ ...deliveryForm, contractorId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select contractor" />
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="supplier-name">Supplier Name *</Label>
                        <Input
                          id="supplier-name"
                          value={deliveryForm.supplierName}
                          onChange={(e) =>
                            setDeliveryForm({ ...deliveryForm, supplierName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          step="0.01"
                          value={deliveryForm.quantity}
                          onChange={(e) =>
                            setDeliveryForm({ ...deliveryForm, quantity: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="unit-price">Unit Price</Label>
                        <Input
                          id="unit-price"
                          type="number"
                          step="0.01"
                          value={deliveryForm.unitPrice}
                          onChange={(e) =>
                            setDeliveryForm({ ...deliveryForm, unitPrice: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="total-price">Total Price</Label>
                        <Input
                          id="total-price"
                          type="number"
                          step="0.01"
                          value={deliveryForm.totalPrice}
                          onChange={(e) =>
                            setDeliveryForm({ ...deliveryForm, totalPrice: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="delivery-date">Delivery Date *</Label>
                        <Input
                          id="delivery-date"
                          type="date"
                          value={deliveryForm.deliveryDate}
                          onChange={(e) =>
                            setDeliveryForm({ ...deliveryForm, deliveryDate: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="challan-number">Challan/Bill Number</Label>
                        <Input
                          id="challan-number"
                          value={deliveryForm.challanNumber}
                          onChange={(e) =>
                            setDeliveryForm({ ...deliveryForm, challanNumber: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="delivery-notes">Notes</Label>
                      <Textarea
                        id="delivery-notes"
                        value={deliveryForm.notes}
                        onChange={(e) =>
                          setDeliveryForm({ ...deliveryForm, notes: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="qc-status">QC Status</Label>
                      <Select
                        value={deliveryForm.qcStatus}
                        onValueChange={(value) =>
                          setDeliveryForm({ ...deliveryForm, qcStatus: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeliveryDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Recording..." : "Record Delivery"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Material Usage Records</h3>
              <Button variant="outline" size="sm" onClick={loadUsages} disabled={usagesLoading}>
                {usagesLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>

            <Dialog open={usageDialog} onOpenChange={setUsageDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Wrench className="mr-2 h-4 w-4" />
                  Add Usage
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleCreateUsage}>
                  <DialogHeader>
                    <DialogTitle>Record Material Usage</DialogTitle>
                    <DialogDescription>
                      Log materials used in construction activities
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="usage-material">Material *</Label>
                        <Select
                          value={usageForm.materialId}
                          onValueChange={(value) =>
                            setUsageForm({ ...usageForm, materialId: value })
                        }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.name} ({material.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="usage-contractor">Contractor</Label>
                        <Select
                          value={usageForm.contractorId}
                          onValueChange={(value) =>
                            setUsageForm({ ...usageForm, contractorId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select contractor" />
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="usage-labour">Labour</Label>
                        <Select
                          value={usageForm.labourId}
                          onValueChange={(value) =>
                            setUsageForm({ ...usageForm, labourId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select labour" />
                          </SelectTrigger>
                          <SelectContent>
                            {labours.map((labour) => (
                              <SelectItem key={labour.id} value={labour.id}>
                                {labour.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="quantity-used">Quantity Used *</Label>
                        <Input
                          id="quantity-used"
                          type="number"
                          step="0.01"
                          value={usageForm.quantityUsed}
                          onChange={(e) =>
                            setUsageForm({ ...usageForm, quantityUsed: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="usage-date">Usage Date *</Label>
                        <Input
                          id="usage-date"
                          type="date"
                          value={usageForm.usageDate}
                          onChange={(e) =>
                            setUsageForm({ ...usageForm, usageDate: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="used-for">Used For</Label>
                        <Input
                          id="used-for"
                          value={usageForm.usedFor}
                          onChange={(e) =>
                            setUsageForm({ ...usageForm, usedFor: e.target.value })
                          }
                          placeholder="e.g. Footing, Wall Casting"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="usage-notes">Notes</Label>
                      <Textarea
                        id="usage-notes"
                        value={usageForm.notes}
                        onChange={(e) =>
                          setUsageForm({ ...usageForm, notes: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUsageDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Recording..." : "Record Usage"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {usages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantity Used</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Labour</TableHead>
                    <TableHead>Used For</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usages.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell>{new Date(usage.usageDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{usage.material.name}</TableCell>
                      <TableCell>{usage.quantityUsed}</TableCell>
                      <TableCell>{usage.material.unit}</TableCell>
                      <TableCell>{usage.contractor?.name || '-'}</TableCell>
                      <TableCell>{usage.labour?.name || '-'}</TableCell>
                      <TableCell>{usage.usedFor || '-'}</TableCell>
                      <TableCell>{usage.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No usage records yet</p>
                <p className="text-sm">Start by recording material usage</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <StockManagement projectId={projectId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
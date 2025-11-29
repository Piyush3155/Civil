"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MaterialStock, StockSummary } from "@/types/inventory";
import { Package, AlertTriangle, TrendingDown, Settings, Search } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface StockManagementProps {
  projectId: string;
}

export function StockManagement({ projectId }: StockManagementProps) {
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialStock | null>(null);

  const fetchStockSummary = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/inventory/projects/${projectId}/stock/summary`);
      setSummary(response);
    } catch (error) {
      console.error("Failed to fetch stock summary:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStockSummary();
  }, [fetchStockSummary]);

  const filteredStock = summary?.stock.filter((item) =>
    item.material.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStockStatus = (stock: MaterialStock) => {
    if (stock.closingQty <= 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stock.closingQty <= 10) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  if (loading) {
    return <div className="p-4">Loading stock data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalMaterials || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary?.lowStockCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.outOfStockCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Units</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalStockValue.toFixed(2) || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Stock</CardTitle>
          <CardDescription>View and manage on-site material inventory</CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Adjusted</TableHead>
                <TableHead className="text-right">Closing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No stock records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStock.map((stock) => {
                  const status = getStockStatus(stock);
                  return (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.material.name}</TableCell>
                      <TableCell>{stock.material.unit}</TableCell>
                      <TableCell className="text-right">{stock.openingQty}</TableCell>
                      <TableCell className="text-right">{stock.receivedQty}</TableCell>
                      <TableCell className="text-right">{stock.usedQty}</TableCell>
                      <TableCell className="text-right">{stock.adjustedQty}</TableCell>
                      <TableCell className="text-right font-bold">{stock.closingQty}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMaterial(stock);
                            setAdjustmentDialogOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <AdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        material={selectedMaterial}
        projectId={projectId}
        onSuccess={fetchStockSummary}
      />
    </div>
  );
}

interface AdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: MaterialStock | null;
  projectId: string;
  onSuccess: () => void;
}

function AdjustmentDialog({ open, onOpenChange, material, projectId, onSuccess }: AdjustmentDialogProps) {
  const [type, setType] = useState<string>("CORRECTION");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!material || !quantity) return;

    try {
      setLoading(true);
      await apiRequest("/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          materialId: material.materialId,
          type,
          quantity: parseFloat(quantity),
          reason,
        }),
      });

      alert("Stock adjustment created successfully");
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setQuantity("");
      setReason("");
      setType("CORRECTION");
    } catch (error) {
      console.error("Failed to create adjustment:", error);
      alert("Failed to create adjustment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
          <DialogDescription>
            Adjust stock for {material?.material.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Adjustment Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAMAGE">Damage</SelectItem>
                <SelectItem value="LOSS">Loss</SelectItem>
                <SelectItem value="THEFT">Theft</SelectItem>
                <SelectItem value="AUDIT">Audit</SelectItem>
                <SelectItem value="CORRECTION">Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity (use negative for reduction)</Label>
            <Input
              type="number"
              step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter quantity in ${material?.material.unit || "units"}`}
            />
          </div>

          <div>
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for adjustment..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !quantity}>
            {loading ? "Submitting..." : "Submit Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

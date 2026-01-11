"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PurchaseOrder, ProcurementSummary, Supplier } from "@/types/procurement";
import { 
  ShoppingCart, 
  TrendingUp, 
  AlertCircle,
  Plus,
  FileText,
  Truck,
  CheckCircle2,
  LucideIcon
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";

interface ProcurementDashboardProps {
  projectId: string;
}

export function ProcurementDashboard({ projectId }: ProcurementDashboardProps) {
  const [summary, setSummary] = useState<ProcurementSummary | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [completingPO] = useState<string | null>(null);
  const [updatingStatusPO, setUpdatingStatusPO] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, posRes, suppliersRes] = await Promise.all([
        apiRequest(`/procurement/projects/${projectId}/summary`),
        apiRequest(`/procurement/projects/${projectId}/purchase-orders`),
        apiRequest(`/procurement/suppliers?isActive=true`),
      ]);
      
      setSummary(summaryRes);
      setPurchaseOrders(posRes);
      setSuppliers(suppliersRes);
    } catch (error) {
      console.error("Failed to fetch procurement data:", error);
      alert("Failed to load procurement data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPOs = purchaseOrders.filter((po) =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const variants: Record<typeof status, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      DRAFT: { variant: "outline", label: "Draft" },
      PENDING_APPROVAL: { variant: "secondary", label: "Pending Approval" },
      APPROVED: { variant: "default", label: "Approved" },
      SENT_TO_SUPPLIER: { variant: "default", label: "Sent to Supplier" },
      PARTIALLY_DELIVERED: { variant: "secondary", label: "Partially Delivered" },
      COMPLETED: { variant: "default", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
      SENT: {
        variant: "default",
        label: ""
      },
      DELIVERED: {
        variant: "default",
        label: ""
      }
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };


  const updatePurchaseOrderStatus = async (poId: string, action: string) => {
    try {
      setUpdatingStatusPO(poId);
      await apiRequest(`/procurement/purchase-orders/${poId}/${action}`, {
        method: 'POST',
      });
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error(`Error updating purchase order status:`, error);
      alert(`Failed to update purchase order status`);
    } finally {
      setUpdatingStatusPO(null);
    }
  };

  const getAvailableActions = (status: PurchaseOrder['status']) => {
    const actions: Array<{ label: string; action: string; icon: LucideIcon }> = [];

    switch (status) {
      case 'DRAFT':
        actions.push({ label: 'Approve', action: 'approve', icon: CheckCircle2 });
        break;
      case 'APPROVED':
        actions.push(
          { label: 'Send to Supplier', action: 'send', icon: Truck },
          { label: 'Mark as Sent', action: 'mark-sent', icon: Truck }
        );
        break;
      case 'SENT_TO_SUPPLIER':
        actions.push({ label: 'Mark as Sent', action: 'mark-sent', icon: Truck });
        break;
      case 'SENT':
        actions.push(
          { label: 'Partially Delivered', action: 'mark-partially-delivered', icon: Truck },
          { label: 'Delivered', action: 'mark-delivered', icon: CheckCircle2 }
        );
        break;
      case 'PARTIALLY_DELIVERED':
        actions.push({ label: 'Delivered', action: 'mark-delivered', icon: CheckCircle2 });
        break;
      case 'DELIVERED':
        actions.push({ label: 'Complete', action: 'complete', icon: CheckCircle2 });
        break;
    }

    return actions;
  };


  if (loading) {
    return <div className="p-4">Loading procurement data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPOs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.statusCounts.PENDING_APPROVAL || 0} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{summary?.totalValue.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all POs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">Registered suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed POs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.statusCounts.COMPLETED || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.statusCounts.PARTIALLY_DELIVERED || 0} partially delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="purchase-orders" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Link href={`/projects/${projectId}/procurement/purchase-requests/new`}>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </Link>
            <Link href={`/projects/${projectId}/procurement/purchase-orders/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create PO
              </Button>
            </Link>
          </div>
        </div>

        <TabsContent value="purchase-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>Manage purchase orders and track deliveries</CardDescription>
              <div className="pt-4">
                <Input
                  placeholder="Search by PO number or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No purchase orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPOs.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.poNumber}</TableCell>
                        <TableCell>{po.supplier.name}</TableCell>
                        <TableCell>{getStatusBadge(po.status)}</TableCell>
                        <TableCell className="text-right">
                          ₹{po.grandTotal.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(po.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end flex-wrap">
                            <Link href={`/projects/${projectId}/procurement/purchase-orders/${po.id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                            {getAvailableActions(po.status).map((action) => {
                              const Icon = action.icon;
                              const isLoading = updatingStatusPO === po.id || completingPO === po.id;
                              return (
                                <Button
                                  key={action.action}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updatePurchaseOrderStatus(po.id, action.action)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    "Updating..."
                                  ) : (
                                    <>
                                      <Icon className="h-4 w-4 mr-1" />
                                      {action.label}
                                    </>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Suppliers</CardTitle>
                <CardDescription>Manage supplier information and contacts</CardDescription>
              </div>
              <Link href="/suppliers/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {suppliers.map((supplier) => (
                  <Card key={supplier.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{supplier.name}</CardTitle>
                      {supplier.contactName && (
                        <CardDescription>{supplier.contactName}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {supplier.phone && (
                        <p className="text-sm">📞 {supplier.phone}</p>
                      )}
                      {supplier.email && (
                        <p className="text-sm">✉️ {supplier.email}</p>
                      )}
                      {supplier.gstNumber && (
                        <p className="text-sm text-muted-foreground">
                          GST: {supplier.gstNumber}
                        </p>
                      )}
                      <div className="pt-2">
                        <Link href={`/projects/${projectId}/procurement/suppliers/${supplier.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {suppliers.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No suppliers found. Add your first supplier to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Requests</CardTitle>
              <CardDescription>Material requisitions pending approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Purchase requests will be displayed here</p>
                <p className="text-sm mt-2">
                  Create a new request to get started
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

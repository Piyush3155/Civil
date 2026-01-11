"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Building2,
  Package,
  FileText,
  User,
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Printer,
  Download,
} from "lucide-react";
import { PurchaseOrder } from "@/types/analytics";
import { Separator } from "@radix-ui/react-separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { SidebarTrigger } from "../ui/sidebar";
import { generatePurchaseOrderPDF, PurchaseOrderPDFData } from "@/lib/purchase-order-pdf-generator";

interface PurchaseOrderDetailProps {
  projectId: string;
  purchaseOrderId: string;
}

interface ExtendedPurchaseOrder extends Omit<PurchaseOrder, 'creator' | 'approver'> {
  items: {
    id: string;
    material: {
      name: string;
      unit: string;
    };
    quantity: number;
    unitPrice: number;
    amount: number;
    taxPercent?: number;
    taxAmount?: number;
    totalAmount: number;
    deliveredQty: number;
    pendingQty: number;
    notes?: string;
  }[];
  paymentTerms: string | undefined;
  deliveryAddress: string | undefined;
  notes: string | undefined;
  grandTotal: number;
  taxAmount: number | undefined;
  totalAmount: number;
  project: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
  approvedAt?: Date;
}

export default function PurchaseOrderDetail({ purchaseOrderId }: PurchaseOrderDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState<ExtendedPurchaseOrder | null>(null);

  // Fetch purchase order data
  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      if (!purchaseOrderId) return;

      try {
        setLoading(true);
        const data = await apiRequest(`/procurement/purchase-orders/${purchaseOrderId}`);
        setPurchaseOrder(data);
      } catch (error) {
        console.error("Error fetching purchase order:", error);
        toast({
          title: "Error",
          description: "Failed to load purchase order details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrder();
  }, [purchaseOrderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!purchaseOrder) {
      toast({
        title: "Error",
        description: "Purchase order data not available.",
        variant: "destructive",
      });
      return;
    }

    try {
      setPdfLoading(true);

      const pdfData: PurchaseOrderPDFData = {
        poNumber: purchaseOrder.poNumber,
        createdAt: purchaseOrder.createdAt,
        status: purchaseOrder.status,
        project: {
          name: purchaseOrder.project.name,
        },
        supplier: {
          name: purchaseOrder.supplier.name,
          email: purchaseOrder.supplier.email,
          phone: purchaseOrder.supplier.phone,
        },
        deliveryAddress: purchaseOrder.deliveryAddress,
        paymentTerms: purchaseOrder.paymentTerms,
        items: purchaseOrder.items.map(item => ({
          material: {
            name: item.material.name,
            unit: item.material.unit,
          },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          notes: item.notes,
        })),
        totalAmount: purchaseOrder.totalAmount,
        taxAmount: purchaseOrder.taxAmount,
        grandTotal: purchaseOrder.grandTotal,
        notes: purchaseOrder.notes,
      };

      await generatePurchaseOrderPDF(pdfData);

      toast({
        title: "Success",
        description: "Purchase order PDF downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: "secondary" as const, icon: FileText, label: "Draft" },
      PENDING_APPROVAL: { variant: "outline" as const, icon: Clock, label: "Pending Approval" },
      APPROVED: { variant: "default" as const, icon: CheckCircle, label: "Approved" },
      SENT_TO_SUPPLIER: { variant: "default" as const, icon: Truck, label: "Sent to Supplier" },
      SENT: { variant: "default" as const, icon: Truck, label: "Sent" },
      PARTIALLY_DELIVERED: { variant: "outline" as const, icon: Clock, label: "Partially Delivered" },
      COMPLETED: { variant: "default" as const, icon: CheckCircle, label: "Completed" },
      DELIVERED: { variant: "default" as const, icon: CheckCircle, label: "Delivered" },
      CANCELLED: { variant: "destructive" as const, icon: XCircle, label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium">
        <Icon className="h-4 w-4" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="max-w-md">
          <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Purchase Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The purchase order you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button
            onClick={() => router.back()}
            className="w-full sm:w-auto"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .no-print { display: none !important; }
            .print-break { page-break-before: always; }
            body { background: white !important; }
            .min-h-screen { min-height: auto !important; }
          }
        `
      }} />

      <div className="min-h-screen bg-gray-50/50">
            <header className="hidden md:flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">Project</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Purchase Order</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        
        <div className="mb-8 no-print">
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.back()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {pdfLoading ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Purchase Order Header */}
        <Card className="mb-8 shadow-sm border-0 bg-white">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold text-gray-900">
                  {purchaseOrder.poNumber}
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Purchase Order for {purchaseOrder.project.name}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {getStatusBadge(purchaseOrder.status)}
                <div className="text-sm text-muted-foreground">
                  Created {new Date(purchaseOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
    
        {/* Purchase Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Supplier & Project Info */}
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Supplier & Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Supplier Details</h4>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900">{purchaseOrder.supplier.name}</p>
                        {purchaseOrder.supplier.email && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {purchaseOrder.supplier.email}
                          </p>
                        )}
                        {purchaseOrder.supplier.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            {purchaseOrder.supplier.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900">{purchaseOrder.project.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Created {new Date(purchaseOrder.createdAt).toLocaleDateString('en-IN')}
                        </p>
                        {purchaseOrder.creator && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            By {purchaseOrder.creator.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval Info */}
                {purchaseOrder.approvedAt && purchaseOrder.approver && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Approved</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Approved on {new Date(purchaseOrder.approvedAt).toLocaleDateString('en-IN')} by {purchaseOrder.approver.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery & Payment Info */}
            {/* {(purchaseOrder.deliveryAddress || purchaseOrder.paymentTerms) && (
              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Delivery & Payment Terms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {purchaseOrder.deliveryAddress && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Delivery Address
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {purchaseOrder.deliveryAddress}
                        </p>
                      </div>
                    )}
                    {purchaseOrder.paymentTerms && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          Payment Terms
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {purchaseOrder.paymentTerms}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )} */}

            {/* Notes */}
            {purchaseOrder.notes && (
              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {purchaseOrder.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Items Table */}
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b bg-gray-50/50">
                        <TableHead className="font-semibold text-gray-900">Material</TableHead>
                        <TableHead className="text-right font-semibold text-gray-900">Quantity</TableHead>
                        <TableHead className="text-right font-semibold text-gray-900">Unit Price</TableHead>
                        <TableHead className="text-right font-semibold text-gray-900">Amount</TableHead>
                        <TableHead className="text-right font-semibold text-gray-900">Tax</TableHead>
                        <TableHead className="text-right font-semibold text-gray-900">Total</TableHead>
                        <TableHead className="text-right font-semibold text-gray-900">Delivered</TableHead>
                        <TableHead className="text-right font-semibold text-gray-900">Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrder.items.map((item, index) => (
                        <TableRow key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{item.material.name}</div>
                              {item.notes && (
                                <div className="text-sm text-muted-foreground mt-1">{item.notes}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.quantity.toLocaleString()} {item.material.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{item.unitPrice.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.taxPercent ? `${item.taxPercent}%` : '-'}
                            {item.taxAmount && item.taxAmount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                ₹{item.taxAmount.toLocaleString('en-IN')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900">
                            ₹{item.totalAmount.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-medium">
                              {item.deliveredQty.toLocaleString()} {item.material.unit}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-orange-600 font-medium">
                              {item.pendingQty.toLocaleString()} {item.material.unit}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="shadow-sm border-0 bg-white sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{purchaseOrder.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {purchaseOrder.taxAmount && purchaseOrder.taxAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tax Amount</span>
                      <span className="font-medium">₹{purchaseOrder.taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                    <span>Grand Total</span>
                    <span>₹{purchaseOrder.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Status</span>
                    {getStatusBadge(purchaseOrder.status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery  */}
            {(purchaseOrder.deliveryAddress || purchaseOrder.paymentTerms) && (
            <Card className="shadow-sm border-0 bg-white no-print">
              <CardHeader className="pb-1">
                <CardTitle className="flex gap-2 items-center text-lg font-semibold">
                  <Truck className="h-5 w-5 text-primary" />
                    Delivery & Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-col gap-6">
                    {purchaseOrder.deliveryAddress && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Delivery Address
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {purchaseOrder.deliveryAddress}
                        </p>
                      </div>
                    )}
                    {purchaseOrder.paymentTerms && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          Payment Terms
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {purchaseOrder.paymentTerms}
                        </p>
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
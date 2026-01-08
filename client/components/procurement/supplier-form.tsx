"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  Save,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "../ui/breadcrumb";
import { SidebarTrigger } from "../ui/sidebar";

interface SupplierFormData {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  panNumber: string;
  isActive: boolean;
}

export default function SupplierForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    isActive: true,
  });

  const handleInputChange = (field: keyof SupplierFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/procurement/suppliers", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      toast({
        title: "Success",
        description: "Supplier created successfully.",
        variant: "success",
      });
      router.back();
    } catch (error) {
      console.error("Error creating supplier:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to create supplier",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Sticky Header */}
      <header className="hidden md:flex sticky top-0 z-40 h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">Add Supplier</BreadcrumbPage>
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
              Add New Supplier
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Create a new supplier record
            </p>
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
            Create Supplier
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Supplier Information</CardTitle>
              </div>
              <CardDescription>Basic details about the supplier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Supplier Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter supplier company name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Person
                  </Label>
                  <Input
                    id="contactName"
                    placeholder="Primary contact name"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="supplier@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="Complete business address"
                  className="min-h-[80px] resize-none bg-background"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>

              {/* Tax Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    GST Number
                  </Label>
                  <Input
                    id="gstNumber"
                    placeholder="22AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panNumber" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    PAN Number
                  </Label>
                  <Input
                    id="panNumber"
                    placeholder="AAAAA0000A"
                    value={formData.panNumber}
                    onChange={(e) => handleInputChange("panNumber", e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Supplier Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable or disable this supplier
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}

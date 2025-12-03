'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Download, Calculator, Building, Wrench, DollarSign } from 'lucide-react';
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
import { fetchEstimateById, createEstimateSection, createEstimateItem, createEstimateComponent, downloadEstimatePdf } from '@/app/actions/estimation/main';

interface Estimate {
  id: string;
  title: string;
  description?: string;
  totalCost: number;
  project: { name: string };
  sections: EstimateSection[];
  items: EstimateItem[];
}

interface EstimateSection {
  id: string;
  name: string;
  items: EstimateItem[];
}

interface EstimateItem {
  id: string;
  sectionId?: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  components: EstimateRateComponent[];
}

interface EstimateRateComponent {
  id: string;
  type: 'MATERIAL' | 'LABOUR' | 'EQUIPMENT' | 'OVERHEAD';
  name: string;
  unit?: string;
  quantity?: number;
  rate?: number;
  cost?: number;
}

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showComponentDialog, setShowComponentDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [sectionForm, setSectionForm] = useState({ name: '', order: 0 });
  const [itemForm, setItemForm] = useState({
    description: '',
    unit: '',
    quantity: 0,
  });
  const [componentForm, setComponentForm] = useState<{
    type: EstimateRateComponent['type'];
    name: string;
    unit: string;
    quantity: number;
    rate: number;
  }>({
    type: 'MATERIAL',
    name: '',
    unit: '',
    quantity: 0,
    rate: 0,
  });

  const loadEstimate = useCallback(async () => {
    try {
      const response = await fetchEstimateById(params.id as string);
      setEstimate(response);
    } catch (error) {
      console.error('Failed to load estimate:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      loadEstimate();
    }
  }, [params.id, loadEstimate]);

  const handleCreateSection = async () => {
    try {
      await createEstimateSection({
        name: sectionForm.name,
        order: sectionForm.order,
        estimateId: params.id as string,
      });
      setShowSectionDialog(false);
      setSectionForm({ name: '', order: 0 });
      loadEstimate();
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  const handleCreateItem = async () => {
    try {
      await createEstimateItem({
        description: itemForm.description,
        unit: itemForm.unit,
        quantity: itemForm.quantity,
        estimateId: params.id as string,
        sectionId: selectedSection || undefined,
      });
      setShowItemDialog(false);
      setItemForm({ description: '', unit: '', quantity: 0 });
      setSelectedSection('');
      loadEstimate();
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  const handleCreateComponent = async () => {
    try {
      await createEstimateComponent({
        type: componentForm.type,
        name: componentForm.name,
        unit: componentForm.unit,
        quantity: componentForm.quantity,
        rate: componentForm.rate,
        itemId: selectedItem,
      });
      setShowComponentDialog(false);
      setComponentForm({
        type: 'MATERIAL',
        name: '',
        unit: '',
        quantity: 0,
        rate: 0,
      });
      setSelectedItem('');
      loadEstimate();
    } catch (error) {
      console.error('Failed to create component:', error);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await downloadEstimatePdf(params.id as string);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'estimate.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!estimate) {
    return <div className="text-center py-12">Estimate not found</div>;
  }

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
                <BreadcrumbPage>Estimation</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>{estimate.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{estimate.title}</h1>
              <p className="text-muted-foreground">Project: {estimate.project.name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Items</p>
                    <p className="text-2xl font-bold">{estimate.items.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Sections</p>
                    <p className="text-2xl font-bold">{estimate.sections.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Components</p>
                    <p className="text-2xl font-bold">
                      {estimate.items.reduce((sum, item) => sum + item.components.length, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Total Cost</p>
                    <p className="text-2xl font-bold">₹{estimate.totalCost.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="sections" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sections">Sections & Items</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="space-y-4">
              <div className="flex gap-2">
                <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Section</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sectionName">Section Name</Label>
                        <Input
                          id="sectionName"
                          value={sectionForm.name}
                          onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                          placeholder="e.g., Foundation, Masonry, Electrical"
                        />
                      </div>
                      <Button onClick={handleCreateSection} className="w-full">
                        Add Section
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add BOQ Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="section">Section (Optional)</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Section</SelectItem>
                            {estimate.sections.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={itemForm.description}
                          onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="unit">Unit</Label>
                          <Input
                            id="unit"
                            value={itemForm.unit}
                            onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                            placeholder="e.g., CFT, SQFT, KG"
                          />
                        </div>
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={itemForm.quantity}
                            onChange={(e) => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreateItem} className="w-full">
                        Add Item
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {estimate.sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {section.name}
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>₹{item.rate}</TableCell>
                            <TableCell>₹{item.amount}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Dialog open={showComponentDialog && selectedItem === item.id} onOpenChange={(open) => {
                                  setShowComponentDialog(open);
                                  if (open) setSelectedItem(item.id);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Add Rate Component</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="type">Type</Label>
                                        <Select
                                          value={componentForm.type}
                                          onValueChange={(value: EstimateRateComponent['type']) => setComponentForm({ ...componentForm, type: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="MATERIAL">Material</SelectItem>
                                            <SelectItem value="LABOUR">Labour</SelectItem>
                                            <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                                            <SelectItem value="OVERHEAD">Overhead</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="componentName">Name</Label>
                                        <Input
                                          id="componentName"
                                          value={componentForm.name}
                                          onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                                          placeholder="Component name"
                                        />
                                      </div>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <Label htmlFor="componentUnit">Unit</Label>
                                          <Input
                                            id="componentUnit"
                                            value={componentForm.unit}
                                            onChange={(e) => setComponentForm({ ...componentForm, unit: e.target.value })}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="componentQuantity">Quantity</Label>
                                          <Input
                                            id="componentQuantity"
                                            type="number"
                                            value={componentForm.quantity}
                                            onChange={(e) => setComponentForm({ ...componentForm, quantity: parseFloat(e.target.value) || 0 })}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="componentRate">Rate</Label>
                                          <Input
                                            id="componentRate"
                                            type="number"
                                            value={componentForm.rate}
                                            onChange={(e) => setComponentForm({ ...componentForm, rate: parseFloat(e.target.value) || 0 })}
                                          />
                                        </div>
                                      </div>
                                      <Button onClick={handleCreateComponent} className="w-full">
                                        Add Component
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}

              {/* Items without sections */}
              {estimate.items.filter(item => !item.sectionId).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>General Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estimate.items.filter(item => !item.sectionId).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>₹{item.rate}</TableCell>
                            <TableCell>₹{item.amount}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Estimate Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {estimate.sections.map((section) => (
                      <div key={section.id}>
                        <h3 className="font-semibold text-lg mb-2">{section.name}</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead>Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{item.description}</p>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {item.components.map((comp, idx) => (
                                        <div key={idx}>
                                          {comp.type}: {comp.name} - {comp.quantity} {comp.unit} × ₹{comp.rate} = ₹{comp.cost}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{item.quantity} {item.unit}</TableCell>
                                <TableCell>₹{item.rate}</TableCell>
                                <TableCell>₹{item.amount}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                    <div className="border-t pt-4">
                      <div className="flex justify-end">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Estimated Cost</p>
                          <p className="text-2xl font-bold">₹{estimate.totalCost.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
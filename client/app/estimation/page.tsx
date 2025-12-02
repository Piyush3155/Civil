'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Download, FileText } from 'lucide-react';
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
import { fetchProjects } from '@/app/actions/projects/main';
import { fetchEstimates, createEstimate, downloadEstimatePdf } from '@/app/actions/estimation/main';

interface Project {
  id: string;
  name: string;
}

interface Estimate {
  id: string;
  title: string;
  description?: string;
  totalCost: number;
  createdAt: string;
  project: Project;
  creator: { name: string };
}

export default function EstimationPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    loadProjects();
    loadEstimates();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetchProjects();
      setProjects(response);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadEstimates = async () => {
    try {
      // For now, load all estimates. In a real app, you'd filter by user's projects
      const response = await fetchEstimates();
      setEstimates(response);
    } catch (error) {
      console.error('Failed to load estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEstimate = async () => {
    try {
      await createEstimate({
        title: formData.title,
        projectId: selectedProject,
      });
      setShowCreateDialog(false);
      setFormData({ title: '', description: '' });
      setSelectedProject('');
      loadEstimates();
    } catch (error) {
      console.error('Failed to create estimate:', error);
    }
  };

  const handleDownloadPdf = async (estimateId: string) => {
    try {
      const blob = await downloadEstimatePdf(estimateId);
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
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Estimation Module</h1>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Estimate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Estimate</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project">Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Estimate title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Estimate description"
                    />
                  </div>
                  <Button onClick={handleCreateEstimate} className="w-full">
                    Create Estimate
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {estimates.map((estimate) => (
              <Card key={estimate.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {estimate.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Project: {estimate.project.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created by: {estimate.creator.name} on {new Date(estimate.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(estimate.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      {estimate.description && (
                        <p className="text-sm mb-2">{estimate.description}</p>
                      )}
                      <Badge variant="secondary">
                        Total Cost: ₹{estimate.totalCost.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {estimates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No estimates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project estimate to get started.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Estimate
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
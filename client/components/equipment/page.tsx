'use client';

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { EquipmentTable } from './equipment-table';
import { columns } from './columns';
import { useProject } from '@/hooks/use-project';
import { AddEquipmentDialog } from './add-equipment-dialog';
import { fetchEquipments } from '@/app/actions/equipment/main';

export default function EquipmentPage() {
  const { projectId } = useProject();
  const { data: equipments, isLoading } = useQuery({
    queryKey: ['equipments', projectId],
    queryFn: () => fetchEquipments(projectId),
  });
  const category = () => {
    //redirect to category page
    window.location.href = '/equipment/category';
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Equipment</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Management</CardTitle>
              <CardDescription>
                Track and manage all your construction equipment.
              </CardDescription>
            </CardHeader>
            <CardContent>
             
              <div className="flex justify-end mb-4 gap-2">
                <AddEquipmentDialog>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Equipment
                  </Button>
                </AddEquipmentDialog>
               
                  <Button onClick={category} className="bg-foreground hover:bg-foreground/80">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Category 
                  </Button>
              </div>
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <EquipmentTable columns={columns} data={equipments || []} />
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

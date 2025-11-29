import { ProcurementDashboard } from "@/components/procurement/procurement-dashboard";

export default async function ProcurementPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Procurement Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage purchase orders, suppliers, and material requisitions
        </p>
      </div>
      
      <ProcurementDashboard projectId={id} />
    </div>
  );
}

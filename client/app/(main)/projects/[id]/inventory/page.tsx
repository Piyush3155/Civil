import { StockManagement } from "@/components/inventory/stock-management";

export default async function InventoryPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">
          Track material stock, deliveries, usage, and adjustments
        </p>
      </div>
      
      <StockManagement projectId={id} />
    </div>
  );
}

import PurchaseOrderDetail from "@/components/procurement/purchase-order-detail";

interface PageProps {
  params: Promise<{ id: string; purchaseOrderId: string }>;
}

export default async function PurchaseOrderDetailPage({ params }: PageProps) {
  const { id: projectId, purchaseOrderId } = await params;

  return (
    <div className="">
      <PurchaseOrderDetail projectId={projectId} purchaseOrderId={purchaseOrderId} />
    </div>
  );
}
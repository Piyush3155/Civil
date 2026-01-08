import PurchaseOrderForm from "@/components/procurement/purchase-order-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatePurchaseOrderPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="">
      <PurchaseOrderForm projectId={id} />
    </div>
  );
}

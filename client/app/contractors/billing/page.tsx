import { Suspense } from 'react';
import { ContractorBilling } from '@/components/billing/contractor-billing';

export default function ContractorBillingPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Contractor Billing</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ContractorBilling />
      </Suspense>
    </div>
  );
}
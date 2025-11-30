import { FinanceManagement } from '@/components/finance/finance-management';

interface FinancePageProps {
  params: {
    id: string;
  };
}

export default function FinancePage({ params }: FinancePageProps) {
  return <FinanceManagement projectId={params.id} />;
}

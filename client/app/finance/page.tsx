import { FinanceManagement } from '@/components/finance/finance-management';

interface FinancePageProps {
  searchParams: {
    projectId?: string;
  };
}

export default function FinancePage({ searchParams }: FinancePageProps) {
  const projectId = searchParams.projectId || '';
  
  if (!projectId) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Finance Management</h1>
          <p className="text-muted-foreground">
            Please select a project to view finance data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <FinanceManagement projectId={projectId} />
    </div>
  );
}

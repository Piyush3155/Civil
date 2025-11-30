'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingDown, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

interface CashFlowDashboardProps {
  expenses: number;
  advances: number;
  supplierPayments: number;
  materialCosts?: number;
  contractorBills?: number;
}

export function CashFlowDashboard({
  expenses,
  advances,
  supplierPayments,
  materialCosts = 0,
  contractorBills = 0,
}: CashFlowDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalCashOut = expenses + advances + supplierPayments + materialCosts;
  const outstandingLiabilities = contractorBills;
  const netCashFlow = -totalCashOut;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Cash Out
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalCashOut)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All outgoing payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Project Expenses
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(expenses)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Operational expenses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Advances Paid
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(advances)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Contractor advances
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Outstanding Bills
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {formatCurrency(outstandingLiabilities)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pending payments
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

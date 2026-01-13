'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign } from 'lucide-react';

interface ExpenseSummaryCardProps {
  totalExpenses: number;
  categoryCount: number;
  lastMonthExpenses?: number;
  averageExpense?: number;
}

export function ExpenseSummaryCard({
  totalExpenses,
  categoryCount,
  lastMonthExpenses = 0,
  averageExpense = 0,
}: ExpenseSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const percentageChange = lastMonthExpenses
    ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
    : 0;

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Expenses
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          {lastMonthExpenses > 0 && (
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {percentageChange > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
              )}
              <span className={percentageChange > 0 ? 'text-red-500' : 'text-green-500'}>
                {Math.abs(percentageChange).toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Categories
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{categoryCount}</div>
          <p className="text-xs text-muted-foreground">
            Active expense categories
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Expense
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(averageExpense)}</div>
          <p className="text-xs text-muted-foreground">
            Per transaction
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Last Month
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(lastMonthExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            Previous period
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

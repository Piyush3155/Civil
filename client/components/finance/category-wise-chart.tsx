'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Expense } from '@/types/finance';

interface CategoryWiseChartProps {
  expenses: Expense[];
}

export function CategoryWiseChart({ expenses }: CategoryWiseChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const categoryTotals = expenses.reduce((acc, expense) => {
    const categoryName = expense.category?.name || 'Uncategorized';
    acc[categoryName] = (acc[categoryName] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const maxAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category-wise Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No expense data available
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map(([category, amount]) => {
              const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

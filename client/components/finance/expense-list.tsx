'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Eye } from 'lucide-react';
import { Expense } from '@/types/finance';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete?: (id: string) => Promise<void>;
  onView?: (expense: Expense) => void;
}

export function ExpenseList({ expenses, onDelete, onView }: ExpenseListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPaymentModeBadge = (mode: string) => {
    const variants: Record<string, string> = {
      CASH: 'default',
      UPI: 'secondary',
      BANK_TRANSFER: 'outline',
      CHEQUE: 'outline',
      CARD: 'secondary',
      OTHER: 'default',
    };
    return variants[mode] || 'default';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense List</CardTitle>
        <CardDescription>
          All recorded expenses for this project
        </CardDescription>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No expenses recorded yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Paid To</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.paymentDate)}</TableCell>
                  <TableCell className="font-medium">
                    {expense.category?.name || '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.description || '-'}
                  </TableCell>
                  <TableCell>{expense.paidTo || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getPaymentModeBadge(expense.paymentMode) as 'default' | 'secondary' | 'outline'}>
                      {expense.paymentMode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onView && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(expense)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

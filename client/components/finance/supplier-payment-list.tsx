'use client';

import {
  Card,
  CardContent,
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
import { SupplierPayment } from '@/types/finance';

interface SupplierPaymentListProps {
  payments: SupplierPayment[];
}

export function SupplierPaymentList({ payments }: SupplierPaymentListProps) {
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

  const totalPayments = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Payments</CardTitle>
        <div className="text-sm text-muted-foreground">
          Total: {formatCurrency(totalPayments)}
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payments recorded yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell className="font-medium">
                    {payment.supplier?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {payment.po?.poNumber || '-'}
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">
                    {payment.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(payment.amount))}
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

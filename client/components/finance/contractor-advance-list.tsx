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
import { ContractorAdvance } from '@/types/finance';

interface ContractorAdvanceListProps {
  advances: ContractorAdvance[];
}

export function ContractorAdvanceList({ advances }: ContractorAdvanceListProps) {
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

  const totalAdvances = advances.reduce((sum, adv) => sum + Number(adv.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contractor Advances</CardTitle>
        <div className="text-sm text-muted-foreground">
          Total: {formatCurrency(totalAdvances)}
        </div>
      </CardHeader>
      <CardContent>
        {advances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No advances recorded yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances.map((advance) => (
                <TableRow key={advance.id}>
                  <TableCell>{formatDate(advance.paidDate)}</TableCell>
                  <TableCell className="font-medium">
                    {advance.contractor?.name || '-'}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {advance.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(advance.amount))}
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

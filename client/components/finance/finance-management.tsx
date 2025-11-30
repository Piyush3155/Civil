'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseSummaryCard } from './expense-summary-card';
import { ExpenseList } from './expense-list';
import { ContractorAdvanceList } from './contractor-advance-list';
import { SupplierPaymentList } from './supplier-payment-list';
import { CategoryWiseChart } from './category-wise-chart';
import { CashFlowDashboard } from './cash-flow-dashboard';
import { AddExpenseCategoryDialog } from './add-expense-category-dialog';
import { AddExpenseDialog } from './add-expense-dialog';
import { AddContractorAdvanceDialog } from './add-contractor-advance-dialog';
import { AddSupplierPaymentDialog } from './add-supplier-payment-dialog';
import {
  fetchExpenseCategories,
  createExpenseCategory,
  fetchProjectExpenses,
  createExpense,
  deleteExpense,
  fetchContractorAdvances,
  createContractorAdvance,
  fetchSupplierPayments,
  createSupplierPayment,
  fetchContractors,
  fetchSuppliers,
  fetchPurchaseOrders,
} from '@/app/actions/finance/main';
import {
  Expense,
  ExpenseCategory,
  ContractorAdvance,
  SupplierPayment,
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  CreateContractorAdvanceDto,
  CreateSupplierPaymentDto,
} from '@/types/finance';
import { toast } from 'sonner';

interface Contractor {
  id: string;
  name: string;
  phone?: string;
}

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
}

interface FinanceManagementProps {
  projectId: string;
}

export function FinanceManagement({ projectId }: FinanceManagementProps) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [advances, setAdvances] = useState<ContractorAdvance[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, expensesData, advancesData, paymentsData] = await Promise.all([
        fetchExpenseCategories(),
        fetchProjectExpenses(projectId),
        fetchContractorAdvances(projectId),
        fetchSupplierPayments(projectId),
      ]);

      setCategories(categoriesData);
      setExpenses(expensesData);
      setAdvances(advancesData);
      setPayments(paymentsData);

      try {
        const contractorsData = await fetchContractors();
        setContractors(contractorsData);
      } catch (error) {
        console.error('Failed to load contractors:', error);
      }

      try {
        const suppliersData = await fetchSuppliers();
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Failed to load suppliers:', error);
      }

      try {
        const posData = await fetchPurchaseOrders(projectId);
        setPurchaseOrders(posData);
      } catch (error) {
        console.error('Failed to load purchase orders:', error);
      }
    } catch (error) {
      console.error('Failed to load finance data:', error);
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (data: CreateExpenseCategoryDto) => {
    try {
      const newCategory = await createExpenseCategory(data);
      setCategories([newCategory, ...categories]);
      toast.success('Expense category added successfully');
    } catch (error) {
      console.error('Failed to add category:', error);
      toast.error('Failed to add expense category');
      throw error;
    }
  };

  const handleAddExpense = async (data: CreateExpenseDto) => {
    try {
      const newExpense = await createExpense(data);
      setExpenses([newExpense, ...expenses]);
      toast.success('Expense added successfully');
    } catch (error) {
      console.error('Failed to add expense:', error);
      toast.error('Failed to add expense');
      throw error;
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleAddAdvance = async (data: CreateContractorAdvanceDto) => {
    try {
      const newAdvance = await createContractorAdvance(data);
      setAdvances([newAdvance, ...advances]);
      toast.success('Contractor advance added successfully');
    } catch (error) {
      console.error('Failed to add advance:', error);
      toast.error('Failed to add contractor advance');
      throw error;
    }
  };

  const handleAddPayment = async (data: CreateSupplierPaymentDto) => {
    try {
      const newPayment = await createSupplierPayment(data);
      setPayments([newPayment, ...payments]);
      toast.success('Supplier payment added successfully');
    } catch (error) {
      console.error('Failed to add payment:', error);
      toast.error('Failed to add supplier payment');
      throw error;
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading finance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance Management</h2>
          <p className="text-muted-foreground">
            Track expenses, payments, and cash flow
          </p>
        </div>
        <AddExpenseCategoryDialog onAdd={handleAddCategory} />
      </div>

      <ExpenseSummaryCard
        totalExpenses={totalExpenses}
        categoryCount={categories.length}
        averageExpense={averageExpense}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryWiseChart expenses={expenses} />
        <CashFlowDashboard
          expenses={totalExpenses}
          advances={advances.reduce((sum, a) => sum + Number(a.amount), 0)}
          supplierPayments={payments.reduce((sum, p) => sum + Number(p.amount), 0)}
        />
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="advances">Contractor Advances</TabsTrigger>
          <TabsTrigger value="payments">Supplier Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex gap-2">
            <AddExpenseDialog
              projectId={projectId}
              categories={categories}
              onAdd={handleAddExpense}
            />
          </div>
          <ExpenseList
            expenses={expenses}
            onDelete={handleDeleteExpense}
          />
        </TabsContent>

        <TabsContent value="advances" className="space-y-4">
          <div className="flex gap-2">
            <AddContractorAdvanceDialog
              projectId={projectId}
              contractors={contractors}
              onAdd={handleAddAdvance}
            />
          </div>
          <ContractorAdvanceList advances={advances} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex gap-2">
            <AddSupplierPaymentDialog
              projectId={projectId}
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              onAdd={handleAddPayment}
            />
          </div>
          <SupplierPaymentList payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

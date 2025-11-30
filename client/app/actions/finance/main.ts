"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7001";

// =====================
// EXPENSE CATEGORIES
// =====================

export async function fetchExpenseCategories() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/expense/categories`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch expense categories");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    throw error;
  }
}

export async function createExpenseCategory(data: { name: string }) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/expense/category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create expense category");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating expense category:", error);
    throw error;
  }
}

// =====================
// EXPENSES
// =====================

export async function fetchProjectExpenses(projectId: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/expenses`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch project expenses");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching project expenses:", error);
    throw error;
  }
}

export async function createExpense(data: {
  projectId: string;
  categoryId: string;
  amount: number | string;
  description?: string;
  paymentDate?: string;
  paidById?: string;
  paidTo?: string;
  paymentMode: string;
  receiptUrl?: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/expense`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create expense");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
}

export async function deleteExpense(expenseId: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/expense/${expenseId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete expense");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}

// =====================
// CONTRACTOR ADVANCES
// =====================

export async function fetchContractorAdvances(projectId: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/project/${projectId}/contractor-advances`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch contractor advances");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching contractor advances:", error);
    throw error;
  }
}

export async function createContractorAdvance(data: {
  contractorId: string;
  projectId: string;
  amount: number | string;
  paidDate?: string;
  notes?: string;
  paidById?: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/contractor-advance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create contractor advance");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating contractor advance:", error);
    throw error;
  }
}

// =====================
// SUPPLIER PAYMENTS
// =====================

export async function fetchSupplierPayments(projectId: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/project/${projectId}/supplier-payments`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch supplier payments");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching supplier payments:", error);
    throw error;
  }
}

export async function createSupplierPayment(data: {
  supplierId: string;
  projectId: string;
  poId?: string;
  amount: number | string;
  paymentDate?: string;
  notes?: string;
  paidById?: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/supplier-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create supplier payment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating supplier payment:", error);
    throw error;
  }
}

// =====================
// SUPPORTING DATA
// =====================

export async function fetchContractors() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/contractors`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch contractors");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching contractors:", error);
    throw error;
  }
}

export async function fetchSuppliers() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/procurement/suppliers`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch suppliers");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw error;
  }
}

export async function fetchPurchaseOrders(projectId: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/procurement/projects/${projectId}/purchase-orders`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch purchase orders");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    throw error;
  }
}

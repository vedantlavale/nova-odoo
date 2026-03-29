export type Role = "admin" | "manager" | "employee";

export type AuthUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: Role;
  title: string | null;
  managerId: string | null;
  isActive: boolean;
};

export type Company = {
  id: string;
  name: string;
  country: string;
  baseCurrency: string;
};

export type ApprovalTask = {
  sequence: number;
  approverId: string | null;
  approverName: string | null;
  approverRole: Role;
  approverTitle: string | null;
  required: boolean;
  status: string;
  comment: string | null;
  actedAt: string | null;
};

export type ExpenseAuditLog = {
  actorId: string | null;
  action: string;
  comment: string | null;
  createdAt: string | null;
};

export type Expense = {
  id: string;
  employeeId: string;
  status: "pending" | "approved" | "rejected";
  category: string;
  description: string;
  expenseDate: string;
  originalAmount: number;
  originalCurrency: string;
  companyAmount: number;
  companyCurrency: string;
  currentSequence: number;
  approvalTasks: ApprovalTask[];
  auditLogs: ExpenseAuditLog[];
};

export function compactCurrency(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

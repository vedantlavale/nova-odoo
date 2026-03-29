import type { Types } from "mongoose";

function stringifyId(value: Types.ObjectId | string | null | undefined) {
  if (!value) {
    return null;
  }

  return String(value);
}

export function serializeUser(user: {
  _id: Types.ObjectId | string;
  companyId: Types.ObjectId | string;
  name: string;
  email: string;
  role: string;
  title?: string;
  managerId?: Types.ObjectId | string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: stringifyId(user._id),
    companyId: stringifyId(user.companyId),
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title ?? null,
    managerId: stringifyId(user.managerId),
    isActive: user.isActive,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
}

export function serializeCompany(company: {
  _id: Types.ObjectId | string;
  name: string;
  country: string;
  baseCurrency: string;
  workflowConfig?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: stringifyId(company._id),
    name: company.name,
    country: company.country,
    baseCurrency: company.baseCurrency,
    workflowConfig: company.workflowConfig ?? null,
    createdAt: company.createdAt ?? null,
    updatedAt: company.updatedAt ?? null,
  };
}

export function serializeExpense(expense: {
  _id: Types.ObjectId | string;
  companyId: Types.ObjectId | string;
  employeeId: Types.ObjectId | string;
  status: string;
  category: string;
  description: string;
  expenseDate: Date;
  originalAmount: number;
  originalCurrency: string;
  companyAmount: number;
  companyCurrency: string;
  approvalTasks: Array<{
    sequence: number;
    approverId: Types.ObjectId | string;
    approverName?: string;
    approverRole: string;
    approverTitle?: string;
    required?: boolean;
    status: string;
    comment?: string;
    actedAt?: Date;
  }>;
  auditLogs?: Array<{
    actorId?: Types.ObjectId | string;
    action: string;
    comment?: string;
    createdAt?: Date;
  }>;
  currentSequence: number;
  decisionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: stringifyId(expense._id),
    companyId: stringifyId(expense.companyId),
    employeeId: stringifyId(expense.employeeId),
    status: expense.status,
    category: expense.category,
    description: expense.description,
    expenseDate: expense.expenseDate,
    originalAmount: expense.originalAmount,
    originalCurrency: expense.originalCurrency,
    companyAmount: expense.companyAmount,
    companyCurrency: expense.companyCurrency,
    currentSequence: expense.currentSequence,
    decisionReason: expense.decisionReason ?? null,
    approvalTasks: expense.approvalTasks.map((task) => ({
      sequence: task.sequence,
      approverId: stringifyId(task.approverId),
      approverName: task.approverName ?? null,
      approverRole: task.approverRole,
      approverTitle: task.approverTitle ?? null,
      required: task.required !== false,
      status: task.status,
      comment: task.comment ?? null,
      actedAt: task.actedAt ?? null,
    })),
    auditLogs: (expense.auditLogs ?? []).map((log) => ({
      actorId: stringifyId(log.actorId),
      action: log.action,
      comment: log.comment ?? null,
      createdAt: log.createdAt ?? null,
    })),
    createdAt: expense.createdAt ?? null,
    updatedAt: expense.updatedAt ?? null,
  };
}

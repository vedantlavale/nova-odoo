import { model, models, Schema, type Model, type Types } from "mongoose";

import type { UserRole } from "@/lib/roles";

export type ExpenseStatus = "pending" | "approved" | "rejected";

export type ApprovalTaskStatus = "pending" | "approved" | "rejected" | "skipped";

export interface ApprovalTask {
  sequence: number;
  approverId: Types.ObjectId;
  approverName?: string;
  approverRole: UserRole;
  approverTitle?: string;
  required?: boolean;
  status: ApprovalTaskStatus;
  comment?: string;
  actedAt?: Date;
}

export interface ConditionalRuleSnapshot {
  enabled: boolean;
  percentageThreshold?: number;
  specificApproverUserId?: Types.ObjectId;
  specificApproverTitle?: string;
  operator: "OR" | "AND";
}

export interface AuditLog {
  actorId?: Types.ObjectId;
  action: string;
  comment?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface OCRData {
  merchantName?: string;
  parsedDate?: Date;
  parsedAmount?: number;
  detectedCurrency?: string;
  categoryGuess?: string;
  lineItems?: string[];
  rawText?: string;
  confidence?: number;
}

export interface Expense {
  companyId: Types.ObjectId;
  employeeId: Types.ObjectId;
  employeeManagerId?: Types.ObjectId | null;
  status: ExpenseStatus;
  category: string;
  description: string;
  expenseDate: Date;
  originalAmount: number;
  originalCurrency: string;
  companyAmount: number;
  companyCurrency: string;
  receiptUrl?: string;
  ocrData?: OCRData;
  approvalTasks: ApprovalTask[];
  currentSequence: number;
  conditionalRuleSnapshot: ConditionalRuleSnapshot;
  decisionReason?: "sequential" | "conditional" | "override";
  approvedAt?: Date;
  rejectedAt?: Date;
  finalComment?: string;
  auditLogs: AuditLog[];
  createdAt?: Date;
  updatedAt?: Date;
}

const approvalTaskSchema = new Schema<ApprovalTask>(
  {
    sequence: {
      type: Number,
      required: true,
      min: 1,
    },
    approverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approverName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    approverRole: {
      type: String,
      enum: ["admin", "manager", "employee"],
      required: true,
    },
    approverTitle: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "skipped"],
      default: "pending",
      required: true,
    },
    required: {
      type: Boolean,
      default: true,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    actedAt: {
      type: Date,
    },
  },
  {
    _id: false,
  },
);

const conditionalRuleSnapshotSchema = new Schema<ConditionalRuleSnapshot>(
  {
    enabled: {
      type: Boolean,
      default: false,
      required: true,
    },
    percentageThreshold: {
      type: Number,
      min: 1,
      max: 100,
    },
    specificApproverUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    specificApproverTitle: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    operator: {
      type: String,
      enum: ["OR", "AND"],
      default: "OR",
      required: true,
    },
  },
  {
    _id: false,
  },
);

const auditLogSchema = new Schema<AuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    _id: false,
  },
);

const ocrDataSchema = new Schema<OCRData>(
  {
    merchantName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    parsedDate: {
      type: Date,
    },
    parsedAmount: {
      type: Number,
      min: 0,
    },
    detectedCurrency: {
      type: String,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    categoryGuess: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    lineItems: {
      type: [String],
      default: [],
    },
    rawText: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
  },
  {
    _id: false,
  },
);

const expenseSchema = new Schema<Expense>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    employeeManagerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    expenseDate: {
      type: Date,
      required: true,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    originalCurrency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    companyAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    companyCurrency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    receiptUrl: {
      type: String,
      trim: true,
      maxlength: 400,
    },
    ocrData: {
      type: ocrDataSchema,
    },
    approvalTasks: {
      type: [approvalTaskSchema],
      default: [],
    },
    currentSequence: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      index: true,
    },
    conditionalRuleSnapshot: {
      type: conditionalRuleSnapshotSchema,
      required: true,
    },
    decisionReason: {
      type: String,
      enum: ["sequential", "conditional", "override"],
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    finalComment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    auditLogs: {
      type: [auditLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

expenseSchema.index({ companyId: 1, employeeId: 1, createdAt: -1 });
expenseSchema.index({ companyId: 1, status: 1, currentSequence: 1 });
expenseSchema.index({ "approvalTasks.approverId": 1, "approvalTasks.status": 1 });

export const ExpenseModel: Model<Expense> =
  (models.Expense as Model<Expense>) || model<Expense>("Expense", expenseSchema);

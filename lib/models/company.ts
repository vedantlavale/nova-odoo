import { model, models, Schema, type Model, type Types } from "mongoose";

import { USER_ROLES, type UserRole } from "@/lib/roles";

export type WorkflowStepType = "role" | "user";

export interface WorkflowStep {
  sequence: number;
  type: WorkflowStepType;
  role?: UserRole;
  userId?: Types.ObjectId;
  label?: string;
  required?: boolean;
}

export interface ConditionalRule {
  enabled: boolean;
  percentageThreshold?: number;
  specificApproverUserId?: Types.ObjectId;
  specificApproverTitle?: string;
  operator: "OR" | "AND";
}

export interface WorkflowConfig {
  isManagerApproverRequired: boolean;
  approverSteps: WorkflowStep[];
  conditionalRule: ConditionalRule;
}

export interface Company {
  name: string;
  country: string;
  baseCurrency: string;
  workflowConfig: WorkflowConfig;
  createdAt?: Date;
  updatedAt?: Date;
}

const workflowStepSchema = new Schema<WorkflowStep>(
  {
    sequence: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ["role", "user"],
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    label: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    required: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  },
);

const conditionalRuleSchema = new Schema<ConditionalRule>(
  {
    enabled: {
      type: Boolean,
      default: false,
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
    },
  },
  {
    _id: false,
  },
);

const workflowConfigSchema = new Schema<WorkflowConfig>(
  {
    isManagerApproverRequired: {
      type: Boolean,
      default: true,
    },
    approverSteps: {
      type: [workflowStepSchema],
      default: [],
    },
    conditionalRule: {
      type: conditionalRuleSchema,
      default: () => ({
        enabled: false,
        operator: "OR",
      }),
    },
  },
  {
    _id: false,
  },
);

const companySchema = new Schema<Company>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    baseCurrency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    workflowConfig: {
      type: workflowConfigSchema,
      default: () => ({
        isManagerApproverRequired: true,
        approverSteps: [],
        conditionalRule: {
          enabled: false,
          operator: "OR",
        },
      }),
    },
  },
  {
    timestamps: true,
  },
);

export const CompanyModel: Model<Company> =
  (models.Company as Model<Company>) || model<Company>("Company", companySchema);

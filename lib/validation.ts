import { z } from "zod";

import { USER_ROLES } from "@/lib/roles";

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId format.");

const roleSchema = z.enum(USER_ROLES);

const currencyCodeSchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(64, "Password must not exceed 64 characters.");

export const signupSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
  title: z.string().trim().max(120).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
    managerId: objectIdSchema.optional(),
    title: z.string().trim().max(120).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "employee" && !value.managerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Employees should have a managerId.",
        path: ["managerId"],
      });
    }

    if (value.role !== "employee" && value.managerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only employees can have managerId.",
        path: ["managerId"],
      });
    }
  });

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    role: roleSchema.optional(),
    managerId: objectIdSchema.nullish(),
    title: z.string().trim().max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!Object.keys(value).length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field must be provided.",
      });
    }

    if (value.role && value.role !== "employee" && value.managerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "managerId is only valid for employees.",
        path: ["managerId"],
      });
    }
  });

const workflowStepSchema = z
  .object({
    sequence: z.number().int().min(1),
    type: z.enum(["user", "role"]),
    userId: objectIdSchema.optional(),
    role: roleSchema.optional(),
    label: z.string().trim().max(120).optional(),
    required: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.type === "user" && !value.userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userId"],
        message: "userId is required when step type is user.",
      });
    }

    if (value.type === "role" && !value.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role"],
        message: "role is required when step type is role.",
      });
    }
  });

const conditionalRuleSchema = z
  .object({
    enabled: z.boolean().default(false),
    percentageThreshold: z.number().min(1).max(100).optional(),
    specificApproverUserId: objectIdSchema.optional(),
    specificApproverTitle: z.string().trim().min(2).max(120).optional(),
    operator: z.enum(["OR", "AND"]).default("OR"),
  })
  .superRefine((value, ctx) => {
    if (
      value.enabled &&
      value.percentageThreshold === undefined &&
      !value.specificApproverUserId &&
      !value.specificApproverTitle
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enable at least one conditional strategy (percentage or specific approver).",
      });
    }
  });

export const workflowConfigSchema = z
  .object({
    isManagerApproverRequired: z.boolean().default(true),
    approverSteps: z.array(workflowStepSchema).default([]),
    conditionalRule: conditionalRuleSchema.default({
      enabled: false,
      operator: "OR",
    }),
  });

export const expenseSubmissionSchema = z.object({
  amount: z.number().positive(),
  currency: currencyCodeSchema,
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(3).max(500),
  expenseDate: z.coerce.date(),
  receiptUrl: z.string().url().max(400).optional(),
  receiptText: z.string().trim().max(5000).optional(),
});

export const approvalActionSchema = z.object({
  comment: z.string().trim().max(500).optional(),
});

export const overrideActionSchema = z.object({
  action: z.enum(["approved", "rejected"]),
  comment: z.string().trim().min(2).max(500),
});

export const receiptOcrSchema = z.object({
  rawText: z.string().trim().min(10).max(5000),
  fallbackCurrency: currencyCodeSchema.optional(),
});

export const currencyConversionQuerySchema = z.object({
  amount: z.coerce.number().positive(),
  fromCurrency: currencyCodeSchema,
  toCurrency: currencyCodeSchema,
});

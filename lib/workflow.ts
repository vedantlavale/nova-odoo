import { Types } from "mongoose";

import type { ConditionalRule } from "@/lib/models/company";
import { UserModel, type User } from "@/lib/models/user";
import type {
  ApprovalTask,
  ApprovalTaskStatus,
  ConditionalRuleSnapshot,
} from "@/lib/models/expense";
import { ApiError } from "@/lib/http";
import type { UserRole } from "@/lib/roles";

type ApproverWithName = Pick<User, "name" | "role" | "title"> & {
  _id: Types.ObjectId;
};

function ensureObjectId(value: Types.ObjectId | string) {
  if (value instanceof Types.ObjectId) {
    return value;
  }

  return new Types.ObjectId(value);
}

function buildTask(sequence: number, user: ApproverWithName, required: boolean): ApprovalTask {
  return {
    sequence,
    approverId: ensureObjectId(user._id),
    approverName: user.name,
    approverRole: user.role,
    approverTitle: user.title,
    required,
    status: "pending",
  };
}

export function isApprovalTaskRequired(task: Pick<ApprovalTask, "required">) {
  return task.required !== false;
}

export async function buildApprovalTasks(input: {
  companyId: Types.ObjectId;
  employee: Pick<User, "managerId"> & { _id: Types.ObjectId };
  workflowConfig: {
    isManagerApproverRequired: boolean;
    approverSteps: Array<{
      sequence: number;
      type: "role" | "user";
      role?: UserRole;
      userId?: Types.ObjectId;
      required?: boolean;
    }>;
  };
}) {
  const tasks: ApprovalTask[] = [];
  const dedupe = new Set<string>();

  const addApproverTask = (sequence: number, approver: ApproverWithName, required: boolean) => {
    const dedupeKey = String(approver._id);
    if (dedupe.has(dedupeKey)) {
      return;
    }

    dedupe.add(dedupeKey);
    tasks.push(buildTask(sequence, approver, required));
  };

  let sequenceOffset = 0;

  if (input.workflowConfig.isManagerApproverRequired) {
    if (!input.employee.managerId) {
      throw new ApiError(
        422,
        "Manager approval is enabled, but the employee has no assigned manager. Ask an admin to assign a manager in the Admin user management panel.",
      );
    }

    const manager = await UserModel.findOne({
      _id: input.employee.managerId,
      companyId: input.companyId,
      isActive: true,
    })
      .select("name role title")
      .lean<ApproverWithName | null>();

    if (!manager) {
      throw new ApiError(422, "Assigned manager could not be found or is inactive.");
    }

    addApproverTask(1, manager, true);
    sequenceOffset = 1;
  }

  const sortedSteps = [...input.workflowConfig.approverSteps].sort((a, b) => a.sequence - b.sequence);

  for (const step of sortedSteps) {
    const targetSequence = step.sequence + sequenceOffset;

    if (step.type === "user") {
      if (!step.userId) {
        throw new ApiError(422, "Workflow step of type user must include userId.");
      }

      const approver = await UserModel.findOne({
        _id: step.userId,
        companyId: input.companyId,
        isActive: true,
      })
        .select("name role title")
        .lean<ApproverWithName | null>();

      if (!approver) {
        throw new ApiError(422, `Workflow approver user ${String(step.userId)} not found.`);
      }

      addApproverTask(targetSequence, approver, step.required !== false);
      continue;
    }

    if (!step.role) {
      throw new ApiError(422, "Workflow step of type role must include role.");
    }

    const roleApprovers = await UserModel.find({
      companyId: input.companyId,
      role: step.role,
      isActive: true,
    })
      .select("name role title")
      .lean<ApproverWithName[]>();

    if (!roleApprovers.length) {
      throw new ApiError(422, `No active approvers found for role ${step.role}.`);
    }

    roleApprovers.forEach((approver) =>
      addApproverTask(targetSequence, approver, step.required !== false),
    );
  }

  if (!tasks.length) {
    throw new ApiError(422, "No approvers are configured for this company workflow.");
  }

  return tasks.sort((a, b) => {
    if (a.sequence === b.sequence) {
      return String(a.approverId).localeCompare(String(b.approverId));
    }

    return a.sequence - b.sequence;
  });
}

export function buildConditionalRuleSnapshot(rule: ConditionalRule | undefined): ConditionalRuleSnapshot {
  return {
    enabled: rule?.enabled ?? false,
    percentageThreshold: rule?.percentageThreshold,
    specificApproverUserId: rule?.specificApproverUserId,
    specificApproverTitle: rule?.specificApproverTitle,
    operator: rule?.operator ?? "OR",
  };
}

function isRuleEnabled(rule: ConditionalRuleSnapshot) {
  return rule.enabled && (rule.percentageThreshold || rule.specificApproverUserId || rule.specificApproverTitle);
}

export function skipInactivePendingTasks(
  tasks: ApprovalTask[],
  activeApproverIds: Set<string>,
  actedAt: Date = new Date(),
) {
  let skippedCount = 0;

  tasks.forEach((task) => {
    if (task.status === "pending" && !activeApproverIds.has(String(task.approverId))) {
      task.status = "skipped";
      task.comment = task.comment ?? "Skipped because approver is inactive.";
      task.actedAt = task.actedAt ?? actedAt;
      skippedCount += 1;
    }
  });

  return skippedCount;
}

export function evaluateConditionalRule(rule: ConditionalRuleSnapshot, tasks: ApprovalTask[]) {
  const nonSkippedTasks = tasks.filter((task) => task.status !== "skipped");

  if (!isRuleEnabled(rule) || !nonSkippedTasks.length) {
    return false;
  }

  const hasUnapprovedRequiredApprover = nonSkippedTasks.some(
    (task) => isApprovalTaskRequired(task) && task.status !== "approved",
  );

  if (hasUnapprovedRequiredApprover) {
    return false;
  }

  const approvedTasks = nonSkippedTasks.filter((task) => task.status === "approved");

  const percentageMatch =
    typeof rule.percentageThreshold === "number"
      ? (approvedTasks.length / nonSkippedTasks.length) * 100 >= rule.percentageThreshold
      : undefined;

  const specificUserMatch = rule.specificApproverUserId
    ? approvedTasks.some(
        (task) => String(task.approverId) === String(rule.specificApproverUserId),
      )
    : undefined;

  const specificTitleMatch = rule.specificApproverTitle
    ? approvedTasks.some(
        (task) =>
          task.approverTitle?.toLowerCase() === rule.specificApproverTitle?.toLowerCase(),
      )
    : undefined;

  const specificMatch = [specificUserMatch, specificTitleMatch].some((value) => value === true);

  const hasPercentageRule = typeof percentageMatch === "boolean";
  const hasSpecificRule =
    typeof specificUserMatch === "boolean" || typeof specificTitleMatch === "boolean";

  if (hasPercentageRule && hasSpecificRule) {
    return rule.operator === "AND"
      ? Boolean(percentageMatch && specificMatch)
      : Boolean(percentageMatch || specificMatch);
  }

  if (hasPercentageRule) {
    return Boolean(percentageMatch);
  }

  if (hasSpecificRule) {
    return Boolean(specificMatch);
  }

  return false;
}

export function markPendingTasksAsSkipped(tasks: ApprovalTask[]) {
  tasks.forEach((task) => {
    if (task.status === "pending") {
      task.status = "skipped";
    }
  });
}

export function updateCurrentSequence(tasks: ApprovalTask[], previousSequence: number) {
  const nextPendingSequence = tasks
    .filter((task) => task.status === "pending" && task.sequence > previousSequence)
    .map((task) => task.sequence)
    .sort((a, b) => a - b)[0];

  return nextPendingSequence ?? null;
}

export function isTerminalStatus(status: ApprovalTaskStatus) {
  return status === "approved" || status === "rejected" || status === "skipped";
}

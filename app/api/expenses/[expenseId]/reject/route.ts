import { Types } from "mongoose";

import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ApiError, parseRequestBody, routeErrorHandler, successResponse } from "@/lib/http";
import { ExpenseModel } from "@/lib/models/expense";
import { UserModel } from "@/lib/models/user";
import { serializeExpense } from "@/lib/serializers";
import { approvalActionSchema } from "@/lib/validation";
import {
  evaluateConditionalRule,
  isApprovalTaskRequired,
  markPendingTasksAsSkipped,
  skipInactivePendingTasks,
  updateCurrentSequence,
} from "@/lib/workflow";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ expenseId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuth(["employee", "manager", "admin"]);
    const body = await parseRequestBody(request, approvalActionSchema);
    const { expenseId } = await context.params;

    if (!Types.ObjectId.isValid(expenseId)) {
      throw new ApiError(400, "Invalid expense id.");
    }

    await connectToDatabase();

    const expense = await ExpenseModel.findOne({
      _id: expenseId,
      companyId: user.companyId,
    });

    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    if (expense.status !== "pending") {
      throw new ApiError(409, "Only pending expenses can be rejected.");
    }

    if (String(expense.employeeId) === String(user._id)) {
      throw new ApiError(403, "You cannot reject your own expense.");
    }

    const now = new Date();

    const approverIds = [...new Set(expense.approvalTasks.map((task) => String(task.approverId)))].map(
      (id) => new Types.ObjectId(id),
    );

    const activeApprovers = await UserModel.find({
      _id: { $in: approverIds },
      companyId: user.companyId,
      isActive: true,
    })
      .select("_id")
      .lean<Array<{ _id: Types.ObjectId }>>();

    const activeApproverIds = new Set(activeApprovers.map((approver) => String(approver._id)));

    const skippedInactiveApprovers = skipInactivePendingTasks(
      expense.approvalTasks,
      activeApproverIds,
      now,
    );

    if (skippedInactiveApprovers > 0) {
      expense.auditLogs.push({
        action: "expense.approver.inactive.skipped",
        comment: "Skipped inactive approvers to keep workflow progressing.",
        metadata: {
          skippedCount: skippedInactiveApprovers,
        },
        createdAt: now,
      });
    }

    const pendingTask = expense.approvalTasks.find((task) => {
      return (
        task.sequence === expense.currentSequence &&
        String(task.approverId) === String(user._id) &&
        task.status === "pending"
      );
    });

    if (!pendingTask) {
      throw new ApiError(403, "You are not the current approver for this expense.");
    }

    pendingTask.status = "rejected";
    pendingTask.comment = body.comment;
    pendingTask.actedAt = now;

    expense.auditLogs.push({
      actorId: user._id,
      action: "expense.rejected.step",
      comment: body.comment,
      metadata: {
        requiredApprover: isApprovalTaskRequired(pendingTask),
      },
      createdAt: now,
    });

    if (isApprovalTaskRequired(pendingTask)) {
      expense.status = "rejected";
      expense.rejectedAt = now;
      expense.approvedAt = undefined;
      expense.decisionReason = "sequential";
      expense.finalComment = body.comment;
      markPendingTasksAsSkipped(expense.approvalTasks);
    } else {
      const conditionalMatched = evaluateConditionalRule(
        expense.conditionalRuleSnapshot,
        expense.approvalTasks,
      );

      if (conditionalMatched) {
        expense.status = "approved";
        expense.approvedAt = now;
        expense.rejectedAt = undefined;
        expense.decisionReason = "conditional";
        markPendingTasksAsSkipped(expense.approvalTasks);
      } else {
        const hasPendingInCurrentStep = expense.approvalTasks.some((task) => {
          return task.sequence === expense.currentSequence && task.status === "pending";
        });

        if (!hasPendingInCurrentStep) {
          const nextSequence = updateCurrentSequence(expense.approvalTasks, expense.currentSequence);

          if (nextSequence !== null) {
            expense.currentSequence = nextSequence;
          } else {
            const hasRejectedRequiredTask = expense.approvalTasks.some(
              (task) => isApprovalTaskRequired(task) && task.status === "rejected",
            );

            if (hasRejectedRequiredTask) {
              expense.status = "rejected";
              expense.rejectedAt = now;
              expense.approvedAt = undefined;
              expense.decisionReason = "sequential";
              expense.finalComment = body.comment;
              markPendingTasksAsSkipped(expense.approvalTasks);
            } else {
              const hasAnyApprovedTask = expense.approvalTasks.some(
                (task) => task.status === "approved",
              );

              if (hasAnyApprovedTask) {
                expense.status = "approved";
                expense.approvedAt = now;
                expense.rejectedAt = undefined;
                expense.decisionReason = "sequential";
              } else {
                expense.status = "rejected";
                expense.rejectedAt = now;
                expense.approvedAt = undefined;
                expense.decisionReason = "sequential";
                expense.finalComment = body.comment;
              }
            }
          }
        }
      }
    }

    await expense.save();

    return successResponse({
      expense: serializeExpense(expense.toObject()),
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

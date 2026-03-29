import { Types } from "mongoose";

import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ApiError, parseRequestBody, routeErrorHandler, successResponse } from "@/lib/http";
import { ExpenseModel } from "@/lib/models/expense";
import { serializeExpense } from "@/lib/serializers";
import { overrideActionSchema } from "@/lib/validation";
import { markPendingTasksAsSkipped } from "@/lib/workflow";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ expenseId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuth(["admin"]);
    const body = await parseRequestBody(request, overrideActionSchema);
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

    const now = new Date();

    expense.status = body.action;
    expense.decisionReason = "override";
    expense.finalComment = body.comment;

    if (body.action === "approved") {
      expense.approvedAt = now;
      expense.rejectedAt = undefined;
    } else {
      expense.rejectedAt = now;
      expense.approvedAt = undefined;
    }

    markPendingTasksAsSkipped(expense.approvalTasks);

    expense.auditLogs.push({
      actorId: user._id,
      action: `expense.override.${body.action}`,
      comment: body.comment,
      createdAt: now,
    });

    await expense.save();

    return successResponse({
      expense: serializeExpense(expense.toObject()),
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

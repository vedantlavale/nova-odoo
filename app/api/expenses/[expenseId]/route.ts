import { Types } from "mongoose";

import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ApiError, routeErrorHandler, successResponse } from "@/lib/http";
import { ExpenseModel } from "@/lib/models/expense";
import { UserModel } from "@/lib/models/user";
import { serializeExpense } from "@/lib/serializers";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ expenseId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuth(["employee", "manager", "admin"]);
    const { expenseId } = await context.params;

    if (!Types.ObjectId.isValid(expenseId)) {
      throw new ApiError(400, "Invalid expense id.");
    }

    await connectToDatabase();

    const expense = await ExpenseModel.findOne({
      _id: expenseId,
      companyId: user.companyId,
    }).lean();

    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    const isOwnExpense = String(expense.employeeId) === String(user._id);

    if (user.role === "employee" && !isOwnExpense) {
      throw new ApiError(403, "Employees can only view their own expenses.");
    }

    if (user.role === "manager" && !isOwnExpense) {
      const directReport = await UserModel.exists({
        _id: expense.employeeId,
        companyId: user.companyId,
        managerId: user._id,
      });

      if (!directReport) {
        throw new ApiError(403, "Managers can only view team expenses.");
      }
    }

    return successResponse({
      expense: serializeExpense(expense),
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

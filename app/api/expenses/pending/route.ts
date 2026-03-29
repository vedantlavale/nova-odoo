import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { routeErrorHandler, successResponse } from "@/lib/http";
import { ExpenseModel } from "@/lib/models/expense";
import { serializeExpense } from "@/lib/serializers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { user } = await requireAuth(["manager", "admin", "employee"]);
    await connectToDatabase();

    const expenses = await ExpenseModel.find({
      companyId: user.companyId,
      status: "pending",
      approvalTasks: {
        $elemMatch: {
          approverId: user._id,
          status: "pending",
        },
      },
    })
      .sort({ createdAt: -1 })
      .lean();

    const currentUserPendingExpenses = expenses.filter((expense) => {
      return expense.approvalTasks.some((task) => {
        return (
          task.sequence === expense.currentSequence &&
          String(task.approverId) === String(user._id) &&
          task.status === "pending"
        );
      });
    });

    return successResponse({
      expenses: currentUserPendingExpenses.map((expense) => serializeExpense(expense)),
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

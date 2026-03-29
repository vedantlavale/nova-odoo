import { requireAuth } from "@/lib/auth";
import { convertAmount } from "@/lib/currency";
import { connectToDatabase } from "@/lib/db";
import { ApiError, parseRequestBody, routeErrorHandler, successResponse } from "@/lib/http";
import { ExpenseModel } from "@/lib/models/expense";
import { UserModel } from "@/lib/models/user";
import { parseReceiptText } from "@/lib/ocr";
import { serializeExpense } from "@/lib/serializers";
import { expenseSubmissionSchema } from "@/lib/validation";
import { buildApprovalTasks, buildConditionalRuleSnapshot } from "@/lib/workflow";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(["employee", "manager", "admin"]);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {
      companyId: user.companyId,
    };

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    if (user.role === "employee") {
      query.employeeId = user._id;
    }

    if (user.role === "manager") {
      const teamMembers = await UserModel.find({
        companyId: user.companyId,
        managerId: user._id,
      })
        .select("_id")
        .lean<Array<{ _id: unknown }>>();

      const teamIds = [user._id, ...teamMembers.map((member) => member._id)];
      query.employeeId = { $in: teamIds };
    }

    const expenses = await ExpenseModel.find(query).sort({ createdAt: -1 }).lean();

    return successResponse({
      expenses: expenses.map((expense) => serializeExpense(expense)),
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, company } = await requireAuth(["employee"]);
    const body = await parseRequestBody(request, expenseSubmissionSchema);

    await connectToDatabase();

    const convertedAmount = await convertAmount({
      amount: body.amount,
      fromCurrency: body.currency,
      toCurrency: company.baseCurrency,
    });

    const approvalTasks = await buildApprovalTasks({
      companyId: user.companyId,
      employee: {
        _id: user._id,
        managerId: user.managerId,
      },
      workflowConfig: company.workflowConfig,
    });

    if (!approvalTasks.length) {
      throw new ApiError(422, "No approver steps were generated for this expense.");
    }

    const initialSequence = approvalTasks.map((task) => task.sequence).sort((a, b) => a - b)[0] ?? 1;

    const ocrData = body.receiptText
      ? (() => {
          const parsed = parseReceiptText(body.receiptText);
          return {
            merchantName: parsed.merchantName,
            parsedDate: parsed.date,
            parsedAmount: parsed.amount,
            detectedCurrency: parsed.currency,
            categoryGuess: parsed.category,
            lineItems: parsed.lineItems,
            rawText: body.receiptText,
            confidence: parsed.confidence,
          };
        })()
      : undefined;

    const expense = await ExpenseModel.create({
      companyId: user.companyId,
      employeeId: user._id,
      employeeManagerId: user.managerId ?? null,
      status: "pending",
      category: body.category,
      description: body.description,
      expenseDate: body.expenseDate,
      originalAmount: body.amount,
      originalCurrency: body.currency,
      companyAmount: convertedAmount,
      companyCurrency: company.baseCurrency,
      receiptUrl: body.receiptUrl,
      ocrData,
      approvalTasks,
      currentSequence: initialSequence,
      conditionalRuleSnapshot: buildConditionalRuleSnapshot(company.workflowConfig.conditionalRule),
      auditLogs: [
        {
          actorId: user._id,
          action: "expense.submitted",
          comment: "Expense submitted.",
          metadata: {
            originalAmount: body.amount,
            originalCurrency: body.currency,
            companyAmount: convertedAmount,
            companyCurrency: company.baseCurrency,
          },
          createdAt: new Date(),
        },
      ],
    });

    return successResponse(
      {
        expense: serializeExpense(expense.toObject()),
      },
      201,
    );
  } catch (error) {
    return routeErrorHandler(error);
  }
}

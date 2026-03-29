import { requireAuth } from "@/lib/auth";
import { convertAmount } from "@/lib/currency";
import { parseRequestBody, routeErrorHandler, successResponse } from "@/lib/http";
import { parseReceiptText } from "@/lib/ocr";
import { receiptOcrSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { company } = await requireAuth(["employee"]);
    const body = await parseRequestBody(request, receiptOcrSchema);

    const parsed = parseReceiptText(body.rawText);

    const detectedCurrency = parsed.currency ?? body.fallbackCurrency ?? company.baseCurrency;

    const convertedAmount =
      parsed.amount !== undefined
        ? await convertAmount({
            amount: parsed.amount,
            fromCurrency: detectedCurrency,
            toCurrency: company.baseCurrency,
          })
        : undefined;

    return successResponse({
      extracted: {
        amount: parsed.amount,
        currency: detectedCurrency,
        expenseDate: parsed.date,
        description: parsed.description,
        category: parsed.category,
        merchantName: parsed.merchantName,
        lineItems: parsed.lineItems,
        confidence: parsed.confidence,
      },
      converted: {
        amountInCompanyCurrency: convertedAmount,
        companyCurrency: company.baseCurrency,
      },
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

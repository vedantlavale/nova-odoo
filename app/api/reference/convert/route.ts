import { convertAmount } from "@/lib/currency";
import { ApiError, routeErrorHandler, successResponse } from "@/lib/http";
import { currencyConversionQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = currencyConversionQuerySchema.safeParse({
      amount: searchParams.get("amount"),
      fromCurrency: searchParams.get("fromCurrency"),
      toCurrency: searchParams.get("toCurrency"),
    });

    if (!parsed.success) {
      throw new ApiError(422, "Invalid conversion query parameters.", parsed.error.flatten());
    }

    const convertedAmount = await convertAmount(parsed.data);

    return successResponse({
      amount: parsed.data.amount,
      fromCurrency: parsed.data.fromCurrency,
      toCurrency: parsed.data.toCurrency,
      convertedAmount,
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

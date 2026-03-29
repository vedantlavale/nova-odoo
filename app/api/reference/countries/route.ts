import { listCountriesWithCurrencies } from "@/lib/currency";
import { routeErrorHandler, successResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const countries = await listCountriesWithCurrencies();

    return successResponse({
      countries,
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

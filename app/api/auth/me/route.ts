import { requireAuth } from "@/lib/auth";
import { routeErrorHandler, successResponse } from "@/lib/http";
import { serializeCompany, serializeUser } from "@/lib/serializers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { user, company } = await requireAuth();

    return successResponse({
      user: serializeUser(user),
      company: serializeCompany(company),
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

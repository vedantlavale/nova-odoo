import { destroyCurrentSession } from "@/lib/auth";
import { routeErrorHandler, successResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function POST() {
  try {
    await destroyCurrentSession();

    return successResponse({
      message: "Logged out successfully.",
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

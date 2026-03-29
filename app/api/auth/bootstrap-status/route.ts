import { connectToDatabase } from "@/lib/db";
import { routeErrorHandler, successResponse } from "@/lib/http";
import { UserModel } from "@/lib/models/user";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();

    const adminCount = await UserModel.countDocuments({ role: "admin" });

    return successResponse({
      needsSetup: adminCount === 0,
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

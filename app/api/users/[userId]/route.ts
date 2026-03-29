import { Types } from "mongoose";

import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ApiError, parseRequestBody, routeErrorHandler, successResponse } from "@/lib/http";
import { UserModel } from "@/lib/models/user";
import { serializeUser } from "@/lib/serializers";
import { updateUserSchema } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

async function assertNoManagerCycle(input: {
  companyId: Types.ObjectId;
  targetUserId: string;
  managerId: string;
}) {
  const visited = new Set<string>([input.targetUserId]);
  let cursorId: Types.ObjectId | null = new Types.ObjectId(input.managerId);

  while (cursorId) {
    const key = String(cursorId);

    if (visited.has(key)) {
      throw new ApiError(422, "Manager assignment creates a reporting cycle.");
    }

    visited.add(key);

    const manager: { managerId?: Types.ObjectId | null } | null = await UserModel.findOne({
      _id: cursorId,
      companyId: input.companyId,
    })
      .select("managerId")
      .lean<{ managerId?: Types.ObjectId | null } | null>();

    cursorId = manager?.managerId ?? null;
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { user: actor } = await requireAuth(["admin", "manager"]);
    const { userId } = await context.params;

    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user id.");
    }

    await connectToDatabase();

    const user = await UserModel.findOne({
      _id: userId,
      companyId: actor.companyId,
    })
      .select("-passwordHash")
      .lean();

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    if (
      actor.role === "manager" &&
      String(user._id) !== String(actor._id) &&
      String(user.managerId) !== String(actor._id)
    ) {
      throw new ApiError(403, "Managers can only view their direct reports.");
    }

    return successResponse({
      user: serializeUser(user),
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user: actor } = await requireAuth(["admin"]);
    const { userId } = await context.params;

    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user id.");
    }

    const body = await parseRequestBody(request, updateUserSchema);
    await connectToDatabase();

    const targetUser = await UserModel.findOne({
      _id: userId,
      companyId: actor.companyId,
    });

    if (!targetUser) {
      throw new ApiError(404, "User not found.");
    }

    if (body.isActive === false) {
      const activeDirectReports = await UserModel.countDocuments({
        companyId: actor.companyId,
        managerId: targetUser._id,
        isActive: true,
      });

      if (activeDirectReports > 0) {
        throw new ApiError(
          422,
          "Reassign active direct reports before deactivating this user.",
        );
      }
    }

    if (body.managerId && body.managerId === userId) {
      throw new ApiError(422, "A user cannot be their own manager.");
    }

    if (body.managerId) {
      const manager = await UserModel.findOne({
        _id: body.managerId,
        companyId: actor.companyId,
        isActive: true,
      });

      if (!manager) {
        throw new ApiError(422, "Manager not found.");
      }

      if (manager.role === "employee") {
        throw new ApiError(422, "Manager must have admin or manager role.");
      }

      await assertNoManagerCycle({
        companyId: actor.companyId,
        targetUserId: userId,
        managerId: body.managerId,
      });
    }

    if (body.name !== undefined) {
      targetUser.name = body.name;
    }

    if (body.title !== undefined) {
      targetUser.title = body.title;
    }

    if (body.isActive !== undefined) {
      targetUser.isActive = body.isActive;
    }

    if (body.role !== undefined) {
      targetUser.role = body.role;
    }

    if (body.managerId !== undefined) {
      targetUser.managerId = body.managerId ? new Types.ObjectId(body.managerId) : null;
    }

    if (targetUser.role !== "employee") {
      targetUser.managerId = null;
    }

    if (targetUser.role === "employee" && !targetUser.managerId) {
      throw new ApiError(422, "Employees must have an assigned manager.");
    }

    await targetUser.save();

    return successResponse({
      user: serializeUser(targetUser.toObject()),
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

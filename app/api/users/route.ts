import bcrypt from "bcryptjs";

import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ApiError, parseRequestBody, routeErrorHandler, successResponse } from "@/lib/http";
import { UserModel } from "@/lib/models/user";
import { serializeUser } from "@/lib/serializers";
import { createUserSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { user } = await requireAuth(["admin", "manager"]);
    await connectToDatabase();

    const query =
      user.role === "admin"
        ? { companyId: user.companyId }
        : {
            companyId: user.companyId,
            $or: [{ _id: user._id }, { managerId: user._id }],
          };

    const users = await UserModel.find(query).select("-passwordHash").sort({ createdAt: -1 }).lean();

    return successResponse({
      users: users.map((entry) => serializeUser(entry)),
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user: actor } = await requireAuth(["admin"]);
    const body = await parseRequestBody(request, createUserSchema);

    await connectToDatabase();

    const existingUser = await UserModel.exists({
      companyId: actor.companyId,
      email: body.email,
    });

    if (existingUser) {
      throw new ApiError(409, "A user with this email already exists in the company.");
    }

    if (body.managerId) {
      const manager = await UserModel.findOne({
        _id: body.managerId,
        companyId: actor.companyId,
        isActive: true,
      });

      if (!manager) {
        throw new ApiError(422, "Assigned manager was not found.");
      }

      if (manager.role === "employee") {
        throw new ApiError(422, "Only manager/admin users can be assigned as manager.");
      }
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const createdUser = await UserModel.create({
      companyId: actor.companyId,
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role,
      title: body.title,
      managerId: body.role === "employee" ? body.managerId : null,
      isActive: true,
    });

    return successResponse(
      {
        user: serializeUser(createdUser.toObject()),
      },
      201,
    );
  } catch (error) {
    return routeErrorHandler(error);
  }
}
